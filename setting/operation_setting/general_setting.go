package operation_setting

import (
	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/config"
)

// 额度展示类型
const (
	QuotaDisplayTypeUSD    = "USD"
	QuotaDisplayTypeCNY    = "CNY"
	QuotaDisplayTypeTokens = "TOKENS"
	QuotaDisplayTypeCustom = "CUSTOM"
)

type GeneralSetting struct {
	DocsLink            string `json:"docs_link"`
	PingIntervalEnabled bool   `json:"ping_interval_enabled"`
	PingIntervalSeconds int    `json:"ping_interval_seconds"`
	// 当前站点额度展示类型：USD / CNY / TOKENS
	QuotaDisplayType string `json:"quota_display_type"`
	// 自定义货币符号，用于 CUSTOM 展示类型
	CustomCurrencySymbol string `json:"custom_currency_symbol"`
	// 自定义货币与美元汇率（1 USD = X Custom）
	CustomCurrencyExchangeRate float64 `json:"custom_currency_exchange_rate"`
	// 全局倍率乘数，应用于所有模型的扣费计算（不影响余额显示）
	GlobalQuotaMultiplier float64 `json:"global_quota_multiplier"`
	// 并发倍率功能开关
	ConcurrencyMultiplierEnabled bool `json:"concurrency_multiplier_enabled"`
	// 并发倍率最大增益（默认0.5，即RPM最高时额外加0.5倍率）
	ConcurrencyMultiplierMax float64 `json:"concurrency_multiplier_max"`
	// 并发倍率开始生效的RPM阈值（低于此值不加倍率）
	ConcurrencyMultiplierRPMMin int `json:"concurrency_multiplier_rpm_min"`
	// 并发倍率达到最大值的RPM阈值
	ConcurrencyMultiplierRPMMax int `json:"concurrency_multiplier_rpm_max"`
}

// 默认配置
var generalSetting = GeneralSetting{
	DocsLink:                   "https://github.com/HX-Lin/vibeapi",
	PingIntervalEnabled:        false,
	PingIntervalSeconds:        60,
	QuotaDisplayType:           QuotaDisplayTypeUSD,
	CustomCurrencySymbol:       "¤",
	CustomCurrencyExchangeRate: 1.0,
	GlobalQuotaMultiplier:          1.0,
	ConcurrencyMultiplierEnabled:   false,
	ConcurrencyMultiplierMax:       0.5,
	ConcurrencyMultiplierRPMMin:    5,
	ConcurrencyMultiplierRPMMax:    30,
}

func init() {
	// 注册到全局配置管理器
	config.GlobalConfig.Register("general_setting", &generalSetting)
}

func GetGeneralSetting() *GeneralSetting {
	return &generalSetting
}

// IsCurrencyDisplay 是否以货币形式展示（美元或人民币）
func IsCurrencyDisplay() bool {
	return generalSetting.QuotaDisplayType != QuotaDisplayTypeTokens
}

// IsCNYDisplay 是否以人民币展示
func IsCNYDisplay() bool {
	return generalSetting.QuotaDisplayType == QuotaDisplayTypeCNY
}

// GetQuotaDisplayType 返回额度展示类型
func GetQuotaDisplayType() string {
	return generalSetting.QuotaDisplayType
}

// GetCurrencySymbol 返回当前展示类型对应符号
func GetCurrencySymbol() string {
	switch generalSetting.QuotaDisplayType {
	case QuotaDisplayTypeUSD:
		return "$"
	case QuotaDisplayTypeCNY:
		return "¥"
	case QuotaDisplayTypeCustom:
		if generalSetting.CustomCurrencySymbol != "" {
			return generalSetting.CustomCurrencySymbol
		}
		return "¤"
	default:
		return ""
	}
}

// GetGlobalQuotaMultiplier 返回全局倍率乘数（默认1.0，不影响余额显示，只影响扣费）
func GetGlobalQuotaMultiplier() float64 {
	if generalSetting.GlobalQuotaMultiplier <= 0 {
		return 1.0
	}
	return generalSetting.GlobalQuotaMultiplier
}

// GetEffectiveQuotaMultiplier 返回叠加用户个人倍率增益后的有效倍率
// effectiveMultiplier = globalMultiplier + userOffset
// 如果结果 <= 0，返回全局倍率（防止负倍率）
func GetEffectiveQuotaMultiplier(userOffset float64) float64 {
	gm := GetGlobalQuotaMultiplier()
	if userOffset == 0 {
		return gm
	}
	effective := gm + userOffset
	if effective <= 0 {
		return gm
	}
	return effective
}

// GetConcurrencyMultiplier 根据用户当前 RPM 计算并发倍率增益（0 ~ max）
// RPM < min → 0, RPM >= max → max, 中间线性插值
func GetConcurrencyMultiplier(userId int) float64 {
	if !generalSetting.ConcurrencyMultiplierEnabled {
		return 0
	}
	rpm := common.GetUserRPM(userId)
	rpmMin := generalSetting.ConcurrencyMultiplierRPMMin
	rpmMax := generalSetting.ConcurrencyMultiplierRPMMax
	maxMultiplier := generalSetting.ConcurrencyMultiplierMax

	if rpmMin <= 0 {
		rpmMin = 5
	}
	if rpmMax <= rpmMin {
		rpmMax = rpmMin + 25
	}
	if maxMultiplier <= 0 {
		maxMultiplier = 0.5
	}

	if rpm < rpmMin {
		return 0
	}
	if rpm >= rpmMax {
		return maxMultiplier
	}
	// 线性插值
	return maxMultiplier * float64(rpm-rpmMin) / float64(rpmMax-rpmMin)
}

// GetUsdToCurrencyRate 返回 1 USD = X <currency> 的 X（TOKENS 不适用）
func GetUsdToCurrencyRate(usdToCny float64) float64 {
	switch generalSetting.QuotaDisplayType {
	case QuotaDisplayTypeUSD:
		return 1
	case QuotaDisplayTypeCNY:
		return usdToCny
	case QuotaDisplayTypeCustom:
		if generalSetting.CustomCurrencyExchangeRate > 0 {
			return generalSetting.CustomCurrencyExchangeRate
		}
		return 1
	default:
		return 1
	}
}

/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  Space,
  Table,
  Form,
  Typography,
  Divider,
  Modal,
  Tooltip,
} from '@douyinfe/semi-ui';
import EmptyState from '../../../components/common/ui/EmptyState';
import { Plus, Edit, Trash2, Save, BookOpen, Upload, GripVertical } from 'lucide-react';
import { API, showError, showSuccess } from '../../../helpers';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';

const { Text } = Typography;

const SettingsHelpDocs = ({ options, refresh }) => {
  const { t } = useTranslation();

  const [docList, setDocList] = useState([]);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState(null);
  const [editingDoc, setEditingDoc] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docForm, setDocForm] = useState({
    title: '',
    slug: '',
    content: '',
    sort_order: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const textAreaRef = useRef(null);

  // --- File Upload ---
  const handleFileUpload = useCallback(
    async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      setUploading(true);
      try {
        for (const file of acceptedFiles) {
          const formData = new FormData();
          formData.append('file', file);
          const res = await API.post('/api/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          const { success, message, data: fileUrl } = res.data;
          if (!success) {
            showError(message || t('上传失败'));
            continue;
          }
          const isImage = /\.(png|jpe?g|gif|webp|svg|ico)$/i.test(file.name);
          const markdownSnippet = isImage
            ? `![${file.name}](${fileUrl})\n`
            : `[${file.name}](${fileUrl})\n`;

          setDocForm((prev) => ({
            ...prev,
            content: (prev.content || '') + markdownSnippet,
          }));
        }
        showSuccess(t('文件上传成功'));
      } catch (error) {
        showError(t('上传失败') + ': ' + (error.message || ''));
      } finally {
        setUploading(false);
      }
    },
    [t],
  );

  const { getRootProps, getInputProps, isDragActive, open: openFilePicker } =
    useDropzone({
      onDrop: handleFileUpload,
      accept: {
        'image/png': ['.png'],
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/gif': ['.gif'],
        'image/webp': ['.webp'],
        'image/svg+xml': ['.svg'],
        'image/x-icon': ['.ico'],
        'application/pdf': ['.pdf'],
        'text/plain': ['.txt', '.sh', '.ps1', '.bat', '.toml', '.conf', '.log', '.ini'],
        'text/markdown': ['.md'],
        'text/csv': ['.csv'],
        'text/xml': ['.xml'],
        'text/yaml': ['.yaml', '.yml'],
        'application/json': ['.json'],
      },
      maxSize: 10 * 1024 * 1024,
      noClick: true,
      noKeyboard: true,
    });

  const handlePaste = useCallback(
    async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles = [];
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        await handleFileUpload(imageFiles);
      }
    },
    [handleFileUpload],
  );

  // --- Drag to Reorder ---
  const handleDragStart = (index) => {
    setDragIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const newList = [...docList];
      const [dragged] = newList.splice(dragIndex, 1);
      newList.splice(dragOverIndex, 0, dragged);
      // Update sort_order based on new positions
      const reordered = newList.map((item, idx) => ({
        ...item,
        sort_order: idx,
      }));
      setDocList(reordered);
      setHasChanges(true);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const columns = [
    {
      title: '',
      key: 'drag',
      width: 40,
      render: (text, record, index) => (
        <div
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          style={{ cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <GripVertical size={14} className='text-gray-400' />
        </div>
      ),
    },
    {
      title: t('文档标题'),
      dataIndex: 'title',
      key: 'title',
      render: (text) => (
        <Tooltip content={text} showArrow>
          <div
            style={{
              maxWidth: '200px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: 'bold',
            }}
          >
            {text}
          </div>
        </Tooltip>
      ),
    },
    {
      title: t('路径标识'),
      dataIndex: 'slug',
      key: 'slug',
      render: (text) => (
        <code style={{ fontSize: '12px' }}>/console/help/{text}</code>
      ),
    },
    {
      title: t('操作'),
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (text, record) => (
        <Space>
          <Button
            icon={<Edit size={14} />}
            theme='light'
            type='tertiary'
            size='small'
            onClick={() => handleEditDoc(record)}
          >
            {t('编辑')}
          </Button>
          <Button
            icon={<Trash2 size={14} />}
            type='danger'
            theme='light'
            size='small'
            onClick={() => handleDeleteDoc(record)}
          >
            {t('删除')}
          </Button>
        </Space>
      ),
    },
  ];

  const updateOption = async (key, value) => {
    const res = await API.put('/api/help-docs', {
      key,
      value,
    });
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('帮助文档已更新'));
      if (refresh) refresh();
    } else {
      showError(message);
    }
  };

  const submitDocs = async () => {
    try {
      setLoading(true);
      const docsJson = JSON.stringify(docList);
      await updateOption('console_setting.help_docs', docsJson);
      setHasChanges(false);
    } catch (error) {
      console.error('帮助文档更新失败', error);
      showError(t('保存失败'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoc = () => {
    setEditingDoc(null);
    setDocForm({
      title: '',
      slug: '',
      content: '',
      sort_order: 0,
    });
    setShowDocModal(true);
  };

  const handleEditDoc = (doc) => {
    setEditingDoc(doc);
    setDocForm({
      title: doc.title,
      slug: doc.slug,
      content: doc.content,
      sort_order: doc.sort_order || 0,
    });
    setShowDocModal(true);
  };

  const handleDeleteDoc = (doc) => {
    setDeletingDoc(doc);
    setShowDeleteModal(true);
  };

  const confirmDeleteDoc = () => {
    if (deletingDoc) {
      const newList = docList.filter((item) => item.id !== deletingDoc.id);
      setDocList(newList);
      setHasChanges(true);
      showSuccess(t('文档已删除，请及时点击"保存设置"进行保存'));
    }
    setShowDeleteModal(false);
    setDeletingDoc(null);
  };

  const handleSaveDoc = async () => {
    if (!docForm.title || !docForm.slug || !docForm.content) {
      showError(t('请填写完整的文档信息'));
      return;
    }

    if (!/^[a-z0-9-]+$/.test(docForm.slug)) {
      showError(t('路径标识只允许小写字母、数字和连字符'));
      return;
    }

    // Check for duplicate slug
    const duplicateSlug = docList.find(
      (item) =>
        item.slug === docForm.slug &&
        (!editingDoc || item.id !== editingDoc.id),
    );
    if (duplicateSlug) {
      showError(t('路径标识已存在，请使用不同的标识'));
      return;
    }

    try {
      setModalLoading(true);

      let newList;
      if (editingDoc) {
        newList = docList.map((item) =>
          item.id === editingDoc.id ? { ...item, ...docForm } : item,
        );
      } else {
        const newId = Math.max(...docList.map((item) => item.id), 0) + 1;
        const newDoc = {
          id: newId,
          ...docForm,
        };
        newList = [...docList, newDoc];
      }

      setDocList(newList);
      setHasChanges(true);
      setShowDocModal(false);
      showSuccess(
        editingDoc
          ? t('文档已更新，请及时点击"保存设置"进行保存')
          : t('文档已添加，请及时点击"保存设置"进行保存'),
      );
    } catch (error) {
      showError(t('操作失败') + ': ' + error.message);
    } finally {
      setModalLoading(false);
    }
  };

  const parseDocs = (docsStr) => {
    if (!docsStr) {
      setDocList([]);
      return;
    }

    try {
      const parsed = JSON.parse(docsStr);
      const list = Array.isArray(parsed) ? parsed : [];
      const listWithIds = list.map((item, index) => ({
        ...item,
        id: item.id || index + 1,
      }));
      setDocList(listWithIds);
    } catch (error) {
      console.error('解析帮助文档失败:', error);
      setDocList([]);
    }
  };

  useEffect(() => {
    if (options['console_setting.help_docs'] !== undefined) {
      parseDocs(options['console_setting.help_docs']);
    }
  }, [options['console_setting.help_docs']]);

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      showError(t('请先选择要删除的文档'));
      return;
    }

    const newList = docList.filter(
      (item) => !selectedRowKeys.includes(item.id),
    );
    setDocList(newList);
    setSelectedRowKeys([]);
    setHasChanges(true);
    showSuccess(
      t('已删除 {{count}} 个文档，请及时点击"保存设置"进行保存', {
        count: selectedRowKeys.length,
      }),
    );
  };

  const renderHeader = () => (
    <div className='flex flex-col w-full'>
      <div className='mb-2'>
        <div className='flex items-center text-blue-500'>
          <BookOpen size={16} className='mr-2' />
          <Text>
            {t('管理帮助中心的文档内容，支持 Markdown 格式。拖拽行左侧图标可调整顺序。')}
          </Text>
        </div>
      </div>

      <Divider margin='12px' />

      <div className='flex flex-col md:flex-row justify-between items-center gap-4 w-full'>
        <div className='flex gap-2 w-full md:w-auto order-2 md:order-1'>
          <Button
            theme='light'
            type='primary'
            icon={<Plus size={14} />}
            className='w-full md:w-auto'
            onClick={handleAddDoc}
          >
            {t('添加文档')}
          </Button>
          <Button
            icon={<Trash2 size={14} />}
            type='danger'
            theme='light'
            onClick={handleBatchDelete}
            disabled={selectedRowKeys.length === 0}
            className='w-full md:w-auto'
          >
            {t('批量删除')}{' '}
            {selectedRowKeys.length > 0 && `(${selectedRowKeys.length})`}
          </Button>
          <Button
            icon={<Save size={14} />}
            onClick={submitDocs}
            loading={loading}
            disabled={!hasChanges}
            type='secondary'
            className='w-full md:w-auto'
          >
            {t('保存设置')}
          </Button>
        </div>
      </div>
    </div>
  );

  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return docList.slice(startIndex, endIndex);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys) => {
      setSelectedRowKeys(selectedRowKeys);
    },
    getCheckboxProps: (record) => ({
      disabled: false,
      name: record.id,
    }),
  };

  return (
    <>
      <Form.Section text={renderHeader()}>
        <Table
          columns={columns}
          dataSource={getCurrentPageData()}
          rowSelection={rowSelection}
          rowKey='id'
          scroll={{ x: 'max-content' }}
          pagination={{
            currentPage: currentPage,
            pageSize: pageSize,
            total: docList.length,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ['5', '10', '20', '50'],
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
            onShowSizeChange: (current, size) => {
              setCurrentPage(1);
              setPageSize(size);
            },
          }}
          size='middle'
          loading={loading}
          empty={
            <EmptyState
              preset='noResult'
              size='medium'
              description={t('暂无帮助文档')}
              style={{ padding: 30 }}
            />
          }
          className='overflow-hidden'
        />
      </Form.Section>

      <Modal
        title={editingDoc ? t('编辑文档') : t('添加文档')}
        visible={showDocModal}
        onOk={handleSaveDoc}
        onCancel={() => setShowDocModal(false)}
        okText={t('保存')}
        cancelText={t('取消')}
        confirmLoading={modalLoading}
        width={800}
      >
        <Form
          layout='vertical'
          initValues={docForm}
          key={editingDoc ? editingDoc.id : 'new'}
        >
          <Form.Input
            field='title'
            label={t('文档标题')}
            placeholder={t('请输入文档标题')}
            maxLength={100}
            rules={[{ required: true, message: t('请输入文档标题') }]}
            onChange={(value) => setDocForm({ ...docForm, title: value })}
          />
          <Form.Input
            field='slug'
            label={t('路径标识')}
            placeholder={t('路径标识只允许小写字母、数字和连字符')}
            maxLength={100}
            rules={[{ required: true, message: t('请输入路径标识') }]}
            onChange={(value) => setDocForm({ ...docForm, slug: value })}
            extraText={t('用于 URL 路径，例如：/console/help/your-slug')}
          />
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button
              icon={<Upload size={14} />}
              size='small'
              theme='light'
              onClick={openFilePicker}
              loading={uploading}
            >
              {t('上传图片/文件')}
            </Button>
            <Text type='tertiary' size='small'>
              {t('支持拖拽或粘贴文件，图片/PDF/TXT/JSON/SH/PS1/MD/CSV/YAML等，最大 10MB')}
            </Text>
          </div>
          <div
            {...getRootProps()}
            onPaste={handlePaste}
            style={{
              border: isDragActive
                ? '2px dashed var(--semi-color-primary)'
                : '2px dashed transparent',
              borderRadius: 6,
              transition: 'border-color 0.2s',
            }}
          >
            <input {...getInputProps()} />
            <Form.TextArea
              field='content'
              label={t('文档内容（Markdown）')}
              placeholder={
                isDragActive
                  ? t('松开即可上传文件...')
                  : t('请输入文档内容，支持 Markdown 格式。可拖拽或粘贴图片到此处上传。')
              }
              maxCount={50000}
              rows={12}
              rules={[{ required: true, message: t('请输入文档内容') }]}
              onChange={(value) => setDocForm({ ...docForm, content: value })}
              ref={textAreaRef}
            />
          </div>
        </Form>
      </Modal>

      <Modal
        title={t('确认删除')}
        visible={showDeleteModal}
        onOk={confirmDeleteDoc}
        onCancel={() => {
          setShowDeleteModal(false);
          setDeletingDoc(null);
        }}
        okText={t('确认删除')}
        cancelText={t('取消')}
        type='warning'
        okButtonProps={{
          type: 'danger',
          theme: 'solid',
        }}
      >
        <Text>{t('确定要删除此文档吗？')}</Text>
      </Modal>
    </>
  );
};

export default SettingsHelpDocs;

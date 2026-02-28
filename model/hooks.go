package model

// OnUserCreated is called after a new user is created.
// Set by the service layer to provision upstream tokens, etc.
var OnUserCreated func(userId int, username string)

package model

// Config represents the application configuration file
type Config struct {
	Connections []Connection `yaml:"connections" json:"connections"`
	Settings    Settings     `yaml:"settings,omitempty" json:"settings,omitempty"`
}

// Settings holds application-level settings
type Settings struct {
	DefaultUser        string `yaml:"default_user,omitempty" json:"default_user,omitempty"`
	DefaultPort        int    `yaml:"default_port,omitempty" json:"default_port,omitempty"`
	DefaultIdentityKey string `yaml:"default_identity_key,omitempty" json:"default_identity_key,omitempty"`
}

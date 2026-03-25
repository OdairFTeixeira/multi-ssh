package config

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/odair/multi-ssh/internal/model"
	"gopkg.in/yaml.v3"
)

const (
	configDir  = ".multi-ssh"
	configFile = "connections.yaml"
)

// Manager handles loading and saving configuration
type Manager struct {
	configPath string
}

// NewManager creates a new config manager
func NewManager() (*Manager, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return nil, fmt.Errorf("could not find home directory: %w", err)
	}

	configPath := filepath.Join(homeDir, configDir)
	if err := os.MkdirAll(configPath, 0700); err != nil {
		return nil, fmt.Errorf("could not create config directory: %w", err)
	}

	return &Manager{
		configPath: configPath,
	}, nil
}

// ConfigFilePath returns the full path to the config file
func (m *Manager) ConfigFilePath() string {
	return filepath.Join(m.configPath, configFile)
}

// Load reads the configuration from disk
func (m *Manager) Load() (*model.Config, error) {
	path := m.ConfigFilePath()

	if _, err := os.Stat(path); os.IsNotExist(err) {
		// Create default config
		cfg := &model.Config{
			Connections: []model.Connection{},
			Settings: model.Settings{
				DefaultPort: 22,
				DefaultUser: "root",
			},
		}
		if err := m.Save(cfg); err != nil {
			return nil, err
		}
		return cfg, nil
	}

	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("could not read config file: %w", err)
	}

	var cfg model.Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("could not parse config file: %w", err)
	}

	return &cfg, nil
}

// Save writes the configuration to disk
func (m *Manager) Save(cfg *model.Config) error {
	data, err := yaml.Marshal(cfg)
	if err != nil {
		return fmt.Errorf("could not serialize config: %w", err)
	}

	path := m.ConfigFilePath()
	if err := os.WriteFile(path, data, 0600); err != nil {
		return fmt.Errorf("could not write config file: %w", err)
	}

	return nil
}

// AddConnection adds a new connection to the config
func (m *Manager) AddConnection(conn model.Connection) error {
	cfg, err := m.Load()
	if err != nil {
		return err
	}

	// Set defaults
	if conn.Port == 0 {
		conn.Port = cfg.Settings.DefaultPort
		if conn.Port == 0 {
			conn.Port = 22
		}
	}
	if conn.User == "" {
		conn.User = cfg.Settings.DefaultUser
	}

	cfg.Connections = append(cfg.Connections, conn)
	return m.Save(cfg)
}

// UpdateConnection updates an existing connection
func (m *Manager) UpdateConnection(index int, conn model.Connection) error {
	cfg, err := m.Load()
	if err != nil {
		return err
	}

	if index < 0 || index >= len(cfg.Connections) {
		return fmt.Errorf("invalid connection index: %d", index)
	}

	cfg.Connections[index] = conn
	return m.Save(cfg)
}

// DeleteConnection removes a connection by index
func (m *Manager) DeleteConnection(index int) error {
	cfg, err := m.Load()
	if err != nil {
		return err
	}

	if index < 0 || index >= len(cfg.Connections) {
		return fmt.Errorf("invalid connection index: %d", index)
	}

	cfg.Connections = append(cfg.Connections[:index], cfg.Connections[index+1:]...)
	return m.Save(cfg)
}

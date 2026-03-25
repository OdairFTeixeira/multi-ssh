package model

import "fmt"

// Connection represents an SSH connection configuration
type Connection struct {
	Name        string   `yaml:"name" json:"name"`
	Host        string   `yaml:"host" json:"host"`
	Port        int      `yaml:"port" json:"port"`
	User        string   `yaml:"user" json:"user"`
	IdentityKey string   `yaml:"identity_key,omitempty" json:"identity_key,omitempty"`
	Password    string   `yaml:"password,omitempty" json:"password,omitempty"`
	Group       string   `yaml:"group,omitempty" json:"group,omitempty"`
	Tags        []string `yaml:"tags,omitempty" json:"tags,omitempty"`
	Description string   `yaml:"description,omitempty" json:"description,omitempty"`
}

// DisplayName returns a formatted display name for the connection
func (c Connection) DisplayName() string {
	if c.Description != "" {
		return fmt.Sprintf("%s - %s", c.Name, c.Description)
	}
	return c.Name
}

// ConnectionString returns the ssh connection string
func (c Connection) ConnectionString() string {
	port := c.Port
	if port == 0 {
		port = 22
	}
	return fmt.Sprintf("%s@%s -p %d", c.User, c.Host, port)
}

// SSHArgs returns the arguments for the ssh command
func (c Connection) SSHArgs() []string {
	port := c.Port
	if port == 0 {
		port = 22
	}

	args := []string{}

	if c.IdentityKey != "" {
		args = append(args, "-i", c.IdentityKey)
	}

	args = append(args, "-p", fmt.Sprintf("%d", port))
	args = append(args, fmt.Sprintf("%s@%s", c.User, c.Host))

	return args
}

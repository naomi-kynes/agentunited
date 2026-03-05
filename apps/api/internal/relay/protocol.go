package relay

import "net/http"

// Protocol message types.
const (
	TypeRegister   = "register"
	TypeRegistered = "registered"
	TypeRequest    = "request"
	TypeResponse   = "response"
	TypePing       = "ping"
	TypePong       = "pong"
	TypeError      = "error"
)

type Envelope struct {
	Type string `json:"type"`
}

type RegisterMessage struct {
	Type         string   `json:"type"`
	Token        string   `json:"token"`
	Version      string   `json:"version"`
	Capabilities []string `json:"capabilities"`
}

type RegisteredMessage struct {
	Type      string `json:"type"`
	Subdomain string `json:"subdomain"`
	URL       string `json:"url"`
}

type RequestMessage struct {
	Type    string      `json:"type"`
	ID      string      `json:"id"`
	Method  string      `json:"method"`
	Path    string      `json:"path"`
	Headers http.Header `json:"headers"`
	Body    string      `json:"body"` // base64
}

type ResponseMessage struct {
	Type    string      `json:"type"`
	ID      string      `json:"id"`
	Status  int         `json:"status"`
	Headers http.Header `json:"headers"`
	Body    string      `json:"body"` // base64
}

type ErrorMessage struct {
	Type    string `json:"type"`
	Message string `json:"message"`
}

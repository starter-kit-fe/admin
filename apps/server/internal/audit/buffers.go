package audit

import (
	"bytes"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
)

func attachBodyRecorder(req *http.Request, limit int) *bytes.Buffer {
	if req == nil || req.Body == nil || limit <= 0 {
		return nil
	}
	buf := &bytes.Buffer{}
	req.Body = &bodyRecorder{ReadCloser: req.Body, buf: buf, limit: limit}
	return buf
}

type bodyRecorder struct {
	io.ReadCloser
	buf   *bytes.Buffer
	limit int
}

func (r *bodyRecorder) Read(p []byte) (int, error) {
	n, err := r.ReadCloser.Read(p)
	if n > 0 && r.buf != nil && r.limit > 0 {
		remaining := r.limit - r.buf.Len()
		if remaining > 0 {
			if n <= remaining {
				r.buf.Write(p[:n])
			} else {
				r.buf.Write(p[:remaining])
			}
		}
	}
	return n, err
}

func newResponseRecorder(writer gin.ResponseWriter, limit int) *responseRecorder {
	if limit < 0 {
		limit = 0
	}
	return &responseRecorder{ResponseWriter: writer, buf: &bytes.Buffer{}, limit: limit}
}

type responseRecorder struct {
	gin.ResponseWriter
	buf   *bytes.Buffer
	limit int
}

func (r *responseRecorder) Write(data []byte) (int, error) {
	r.capture(data)
	return r.ResponseWriter.Write(data)
}

func (r *responseRecorder) WriteString(s string) (int, error) {
	r.capture([]byte(s))
	return r.ResponseWriter.WriteString(s)
}

func (r *responseRecorder) capture(data []byte) {
	if r.limit <= 0 || r.buf == nil || len(data) == 0 {
		return
	}
	remaining := r.limit - r.buf.Len()
	if remaining <= 0 {
		return
	}
	if len(data) <= remaining {
		r.buf.Write(data)
		return
	}
	r.buf.Write(data[:remaining])
}

func (r *responseRecorder) String() string {
	if r.buf == nil {
		return ""
	}
	return r.buf.String()
}

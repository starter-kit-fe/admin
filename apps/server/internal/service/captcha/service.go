package captcha

import (
	"bytes"
	"context"
	"encoding/base64"
	"image"
	"image/color"
	"image/draw"
	"image/png"
	"math/rand"
	"strings"
	"sync"
	"time"

	"golang.org/x/image/font"
	"golang.org/x/image/font/basicfont"
	"golang.org/x/image/math/fixed"
)

type Options struct {
	TTL          time.Duration
	Width        int
	Height       int
	CharCount    int
	NoiseLines   int
	NoiseDots    int
	AllowedRunes []rune
}

type Service struct {
	opts  Options
	mu    sync.RWMutex
	store map[string]entry
	rand  *rand.Rand
}

type entry struct {
	answer  string
	expires time.Time
}

type Captcha struct {
	ID        string
	Image     string
	ExpiresIn time.Duration
}

func New(opts Options) *Service {
	if opts.TTL <= 0 {
		opts.TTL = time.Minute * 2
	}
	if opts.Width <= 0 {
		opts.Width = 160
	}
	if opts.Height <= 0 {
		opts.Height = 60
	}
	if opts.CharCount <= 0 {
		opts.CharCount = 4
	}
	if opts.NoiseLines < 0 {
		opts.NoiseLines = 4
	}
	if opts.NoiseDots < 0 {
		opts.NoiseDots = 30
	}
	if len(opts.AllowedRunes) == 0 {
		opts.AllowedRunes = []rune("ABCDEFGHJKLMNPQRSTUVWXYZ23456789")
	}

	return &Service{
		opts:  opts,
		store: make(map[string]entry),
		rand:  rand.New(rand.NewSource(time.Now().UnixNano())),
	}
}

func (s *Service) Generate(_ context.Context) (*Captcha, error) {
	answer := s.randomString(s.opts.CharCount)
	img := s.drawCaptcha(answer)

	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		return nil, err
	}
	imageEncoded := "data:image/png;base64," + base64.StdEncoding.EncodeToString(buf.Bytes())
	id := s.randomString(16)

	s.mu.Lock()
	s.cleanupLocked()
	s.store[id] = entry{
		answer:  strings.ToLower(answer),
		expires: time.Now().Add(s.opts.TTL),
	}
	s.mu.Unlock()

	return &Captcha{
		ID:        id,
		Image:     imageEncoded,
		ExpiresIn: s.opts.TTL,
	}, nil
}

func (s *Service) Verify(_ context.Context, id, answer string, clear bool) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	entry, ok := s.store[id]
	if !ok {
		return false
	}
	if time.Now().After(entry.expires) {
		delete(s.store, id)
		return false
	}

	if strings.EqualFold(entry.answer, strings.TrimSpace(answer)) {
		if clear {
			delete(s.store, id)
		}
		return true
	}

	return false
}

func (s *Service) cleanupLocked() {
	now := time.Now()
	for id, e := range s.store {
		if now.After(e.expires) {
			delete(s.store, id)
		}
	}
}

func (s *Service) randomString(n int) string {
	b := make([]rune, n)
	for i := range b {
		b[i] = s.opts.AllowedRunes[s.rand.Intn(len(s.opts.AllowedRunes))]
	}
	return string(b)
}

func (s *Service) drawCaptcha(answer string) image.Image {
	img := image.NewRGBA(image.Rect(0, 0, s.opts.Width, s.opts.Height))

	bgColor := color.RGBA{R: 245, G: 247, B: 250, A: 255}
	draw.Draw(img, img.Bounds(), &image.Uniform{C: bgColor}, image.Point{}, draw.Src)

	for i := 0; i < s.opts.NoiseLines; i++ {
		x1 := s.rand.Intn(s.opts.Width)
		y1 := s.rand.Intn(s.opts.Height)
		x2 := s.rand.Intn(s.opts.Width)
		y2 := s.rand.Intn(s.opts.Height)
		lineColor := randomColor(s.rand)
		drawLine(img, x1, y1, x2, y2, lineColor)
	}

	for i := 0; i < s.opts.NoiseDots; i++ {
		x := s.rand.Intn(s.opts.Width)
		y := s.rand.Intn(s.opts.Height)
		img.Set(x, y, randomColor(s.rand))
	}

	face := basicfont.Face7x13
	drawer := &font.Drawer{
		Dst:  img,
		Src:  image.NewUniform(color.Black),
		Face: face,
	}

	x := (s.opts.Width - drawer.MeasureString(answer).Round()) / 2
	y := (s.opts.Height + face.Ascent) / 2
	drawer.Dot = fixed.Point26_6{
		X: fixed.I(x),
		Y: fixed.I(y),
	}
	drawer.DrawString(answer)

	return img
}

func randomColor(r *rand.Rand) color.RGBA {
	return color.RGBA{
		R: uint8(r.Intn(200)),
		G: uint8(r.Intn(200)),
		B: uint8(r.Intn(200)),
		A: 255,
	}
}

func drawLine(img *image.RGBA, x1, y1, x2, y2 int, c color.RGBA) {
	dx := abs(x2 - x1)
	dy := abs(y2 - y1)
	sx := -1
	if x1 < x2 {
		sx = 1
	}
	sy := -1
	if y1 < y2 {
		sy = 1
	}
	err := dx - dy

	for {
		img.Set(x1, y1, c)
		if x1 == x2 && y1 == y2 {
			break
		}
		e2 := 2 * err
		if e2 > -dy {
			err -= dy
			x1 += sx
		}
		if e2 < dx {
			err += dx
			y1 += sy
		}
	}
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

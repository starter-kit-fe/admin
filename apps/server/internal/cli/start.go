package cli

import (
	"context"
	"fmt"
	"os/signal"
	"strings"
	"syscall"

	"github.com/spf13/cobra"

	"github.com/starter-kit-fe/admin/internal/app"
	"github.com/starter-kit-fe/admin/internal/config"
)

func NewStartCommand(rootOpts *RootOptions) *cobra.Command {
	var (
		addrFlag     string
		logLevelFlag string
	)

	cmd := &cobra.Command{
		Use:   "start",
		Short: "Start the HTTP server",
		RunE: func(cmd *cobra.Command, args []string) error {
			// 优先使用上下文，便于与上层取消逻辑集成
			baseCtx := cmd.Context()
			if baseCtx == nil {
				baseCtx = context.Background()
			}

			// 加载配置，支持 --env-file 额外指定 dotenv 文件
			cfg, err := config.Load(rootOpts.EnvFiles...)
			if err != nil {
				return fmt.Errorf("load config: %w", err)
			}

			// CLI 参数优先级最高，覆盖配置文件/环境变量
			if addrFlag != "" {
				cfg.HTTP.Addr = normalizeHTTPAddr(addrFlag)
			}
			if logLevelFlag != "" {
				cfg.Log.Level = strings.ToLower(strings.TrimSpace(logLevelFlag))
			}
			cfg.Normalize()

			// 捕获终止信号，确保优雅关闭
			ctx, stop := signal.NotifyContext(baseCtx, syscall.SIGINT, syscall.SIGTERM)
			defer stop()

			// 初始化业务应用并启动 HTTP 服务
			application, err := app.New(ctx, app.Options{Config: cfg})
			if err != nil {
				return err
			}

			return application.Run(ctx)
		},
	}

	cmd.Flags().StringVar(&addrFlag, "addr", "", "HTTP listen address, e.g. :8000")
	cmd.Flags().StringVar(&logLevelFlag, "log-level", "", "Log level: debug, info, warn, error")

	return cmd
}

func normalizeHTTPAddr(addr string) string {
	addr = strings.TrimSpace(addr)
	if addr == "" {
		return ""
	}
	if strings.HasPrefix(addr, ":") {
		return addr
	}
	if !strings.Contains(addr, ":") {
		return ":" + addr
	}
	return addr
}

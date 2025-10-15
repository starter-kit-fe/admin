package cli

import "github.com/spf13/cobra"

// RootOptions 用于在根命令下共享参数配置
type RootOptions struct {
	EnvFiles []string
}

func NewRootCommand() *cobra.Command {
	opts := &RootOptions{}

	cmd := &cobra.Command{
		Use:           "admin",
		Short:         "Administrative service CLI",
		SilenceErrors: true,
		SilenceUsage:  true,
	}

	// 支持通过 --env-file 指定额外的 dotenv 文件
	cmd.PersistentFlags().StringSliceVar(&opts.EnvFiles, "env-file", nil, "Additional dotenv file(s) to load")

	// 注册子命令：启动服务、查看版本信息
	cmd.AddCommand(NewStartCommand(opts))
	cmd.AddCommand(NewVersionCommand())

	return cmd
}

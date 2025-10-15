package cli

import (
	"os"
	"runtime"

	"github.com/spf13/cobra"

	"github.com/starter-kit-fe/admin/constant"
)

func NewVersionCommand() *cobra.Command {
	var nameOnly bool

	cmd := &cobra.Command{
		Use:   "version",
		Short: "Print current build information",
		Run: func(cmd *cobra.Command, args []string) {
			if nameOnly {
				// 仅输出版本号，适合脚本解析
				_, _ = os.Stdout.WriteString(constant.VERSION + "\n")
				return
			}

			// 默认输出详细构建信息，包含提交和运行时
			version := constant.NAME + " version: " + constant.VERSION + "\n"
			version += "Commit: " + constant.COMMIT + "\n"
			version += "Environment: " + runtime.Version() + " " + runtime.GOOS + "/" + runtime.GOARCH + "\n"

			_, _ = os.Stdout.WriteString(version)
		},
	}

	cmd.Flags().BoolVarP(&nameOnly, "name", "n", false, "print version name only")

	return cmd
}

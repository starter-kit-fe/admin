package main

import (
	"context"
	"fmt"
	"os"

	"github.com/starter-kit-fe/admin/internal/cli"
)

func main() {
	if err := cli.
		NewRootCommand().
		ExecuteContext(context.Background()); err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}
}

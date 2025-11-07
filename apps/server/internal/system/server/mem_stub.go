//go:build !darwin

package server

func readMeminfoDarwin() (uint64, uint64) {
	return 0, 0
}

func darwinKernelVersion() string {
	return ""
}

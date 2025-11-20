//go:build darwin

package server

/*
#include <mach/host_info.h>
#include <mach/mach_host.h>
#include <mach/mach_init.h>
#include <stdlib.h>
*/
import "C"
import (
	"errors"
	"fmt"
	"unsafe"
)

func darwinLoadAverage() (float64, float64, float64, error) {
	var loads [3]C.double
	if C.getloadavg(&loads[0], 3) != 3 {
		return 0, 0, 0, errors.New("getloadavg failed")
	}
	return float64(loads[0]), float64(loads[1]), float64(loads[2]), nil
}

func darwinCPUTicks() (total uint64, idle uint64, err error) {
	var count C.mach_msg_type_number_t = C.HOST_CPU_LOAD_INFO_COUNT
	var info C.host_cpu_load_info_data_t

	kr := C.host_statistics(C.mach_host_self(), C.HOST_CPU_LOAD_INFO, C.host_info_t(unsafe.Pointer(&info)), &count)
	if kr != C.KERN_SUCCESS {
		return 0, 0, fmt.Errorf("host_statistics failed with code %d", kr)
	}

	for i := 0; i < C.CPU_STATE_MAX; i++ {
		total += uint64(info.cpu_ticks[i])
	}
	idle = uint64(info.cpu_ticks[C.CPU_STATE_IDLE])
	return total, idle, nil
}

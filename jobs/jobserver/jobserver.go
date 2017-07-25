// Copyright (c) 2017-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

package main

import (
	"os"
	"os/signal"
	"syscall"

	l4g "github.com/alecthomas/log4go"
	"github.com/mattermost/platform/jobs"
	"github.com/mattermost/platform/store"
	"github.com/mattermost/platform/utils"

	_ "github.com/mattermost/platform/imports"
)

func main() {
	// Initialize
	utils.InitAndLoadConfig("config.json")
	defer l4g.Close()

	jobs.Srv.Store = store.NewLayeredStore()
	defer jobs.Srv.Store.Close()

	jobs.Srv.LoadLicense()

	// Run jobs
	l4g.Info("Starting Mattermost job server")
	jobs.Srv.StartWorkers()
	jobs.Srv.StartSchedulers()

	var signalChan chan os.Signal = make(chan os.Signal)
	signal.Notify(signalChan, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)
	<-signalChan

	// Cleanup anything that isn't handled by a defer statement
	l4g.Info("Stopping Mattermost job server")

	jobs.Srv.StopSchedulers()
	jobs.Srv.StopWorkers()

	l4g.Info("Stopped Mattermost job server")
}

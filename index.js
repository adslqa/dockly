#!/usr/bin/env node
'use strict'

/**
 * Project dependencies
 */
const Screen = require('./src/screen')
const DockerUtil = require('./src/dockerUtil')
const cli = require('./src/cli')

function initDockerConnection () {
  return new Promise((resolve, reject) => {

    let utils
    let docker

    try {
      docker = new DockerUtil(cli.cliParse())
    } catch (err) {
      return reject(err)
    }

    docker.ping((err) => {
      if (err) {
        exitError(err)
      }

      utils = new Map([
        ['docker', docker]
      ])

      return resolve(utils)
    })
  })
}

function initScreens (utils) {
  return new Promise((resolve, reject) => {
    let screen
    try {
      screen = new Screen(utils)
      screen.init()
    } catch(err) {
      return reject(err)
    }

    return resolve(screen)
  })
}

initDockerConnection()
  .then(initScreens)
  .then(function(screen) {
    process.on('uncaughtException', (err) => {
      // Make sure the screen is cleared
      screen.teardown()
      exitError(err)
    })
  })
  .catch((err) => {
    console.log(err)
    process.exit(-1)
  })


function exitError(err) {
  cli.showUsage()

  if (err && err.message) {
    console.log('\x1b[31m')

    console.trace('Error: ' + err.message)
    if (err.message === 'Unable to determine the domain name') {
      console.log('-> check your connection options to the docker daemon and confirm containers exist')
    }
    console.log('\x1b[0m')
  }

  process.exit(-1)
}
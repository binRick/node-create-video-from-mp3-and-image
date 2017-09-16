#!/usr/bin/env node

var textPrompt = require('text-prompt'),
    ora = require('ora'),
    path = require('path'),
    c = require('chalk'),
    prettyBytes = require('pretty-bytes'),
    fs = require('fs'),
    child = require('child_process'),
    parse = require('parse-spawn-args').parse,
    ffmpeg = 'ffmpeg',
    CMD = '-threads 0 -loop 1 -i __IMAGE__ -i __MP3__ -c:a copy -c:v libx264 -shortest __OUT__',
    outFormat = 'mkv',
    stdout = '',
    stderr = '',
    outFileSize = 0,
    sizeInterval = null;


var selectImage = function(_cb) {
    textPrompt('What Image would you like to use?')
        .on('data', function(e) {})
        .on('submit', function(v) {
            _cb(v);
        })
        .on('abort', function(v) {});
};

var selectMp3 = function(_cb) {
    textPrompt('What MP3 would you like to use?')
        .on('data', function(e) {})
        .on('submit', function(v) {
            _cb(v);
        })
        .on('abort', function(v) {});
};


selectImage(function(image) {
    selectMp3(function(mp3) {
        var outFile = path.parse(mp3).name + '.' + outFormat;
        if (!fs.existsSync(mp3)) {
            console.log(c.red('Input MP3 File does not exist!'));
            process.exit(-1);
        }
        if (!fs.existsSync(image)) {
            console.log(c.red('Input Image File does not exist!'));
            process.exit(-1);
        }
        if (fs.existsSync(outFile)) {
            console.log(c.red('Output file exists!'));
            process.exit(-1);
        }
        CMD = CMD.replace('__IMAGE__', image).replace('__MP3__', mp3).replace('__OUT__', outFile);
        var args = parse(CMD);
        var proc = child.spawn(ffmpeg, args);
        var spinner = ora('Creating Video File...').start();
        proc.on('exit', function(code) {
            clearInterval(sizeInterval);
            if (code != 0) {
                spinner.fail('Process Failed with exit code: ' + code);
                console.log(c.red(stderr));
                process.exit(-1);
            }
            spinner.succeed('Created File: ' + outFile);
            process.exit();
        });
        proc.stdout.on('data', function(dat) {
            stdout += dat.toString();
        });
        proc.stderr.on('data', function(dat) {
            stderr += dat.toString();
        });
        sizeInterval = setInterval(function() {
            outFileSize = fs.statSync(outFile).size;
            spinner.color = 'yellow';
            spinner.text = ' Created ' + prettyBytes(outFileSize);
        }, 500);
    });
});

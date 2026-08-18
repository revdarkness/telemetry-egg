// ===== SENDER =====
radio.setGroup(42)
radio.setTransmitPower(7)
input.setAccelerometerRange(AcceleratorRange.EightG)

let dropping = false
let startTime = 0
let peakG = 0
let dropNum = 0

datalogger.setColumnTitles("drop", "time_ms", "g", "peak_g")

input.onButtonPressed(Button.A, function () {
    dropNum += 1
    dropping = true
    startTime = input.runningTime()
    peakG = 0
    basic.showIcon(IconNames.Yes)
})

input.onButtonPressed(Button.B, function () {
    dropping = false
    peakG = 0
    basic.showString("R")
})

input.onGesture(Gesture.Shake, function () {
    if (!dropping) {
        datalogger.deleteLog()
        basic.showString("CLR")
    }
})

basic.forever(function () {
    if (dropping) {
        let ax = input.acceleration(Dimension.X)
        let ay = input.acceleration(Dimension.Y)
        let az = input.acceleration(Dimension.Z)
        let mag = Math.sqrt(ax * ax + ay * ay + az * az) / 1024
        let t = input.runningTime() - startTime

        if (mag > peakG) {
            peakG = mag
        }

        datalogger.log(
            datalogger.createCV("drop", dropNum),
            datalogger.createCV("time_ms", t),
            datalogger.createCV("g", Math.round(mag * 100) / 100),
            datalogger.createCV("peak_g", Math.round(peakG * 100) / 100)
        )

        radio.sendValue("t", t)
        radio.sendValue("g", Math.round(mag * 100))
        radio.sendValue("pk", Math.round(peakG * 100))

        if (mag < 0.3) {
            basic.showLeds(`
                . . . . .
                . . . . .
                . . # . .
                . . . . .
                . . . . .
                `)
        } else if (mag > 3) {
            basic.showIcon(IconNames.Skull)
        }
    }
    basic.pause(50)
})
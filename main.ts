// ===== SENDER =====
radio.setGroup(42)
radio.setTransmitPower(7)
input.setAccelerometerRange(AcceleratorRange.EightG)

let armed = false
let inFreefall = false
let landed = false
let freefallStart = 0
let fallTime = 0
let peakG = 0
let dropNum = 0

datalogger.setColumnTitles("drop", "time_ms", "g", "peak_g")

// Press A to ARM (waits for release, doesn't start clock yet)
input.onButtonPressed(Button.A, function () {
    dropNum += 1
    armed = true
    inFreefall = false
    landed = false
    fallTime = 0
    peakG = 0
    basic.showIcon(IconNames.Target)
})

// Press B to reset
input.onButtonPressed(Button.B, function () {
    armed = false
    inFreefall = false
    landed = false
    peakG = 0
    basic.showString("R")
})

input.onGesture(Gesture.Shake, function () {
    if (!armed) {
        datalogger.deleteLog()
        basic.showString("CLR")
    }
})

basic.forever(function () {
    if (armed) {
        let ax = input.acceleration(Dimension.X)
        let ay = input.acceleration(Dimension.Y)
        let az = input.acceleration(Dimension.Z)
        let mag = Math.sqrt(ax * ax + ay * ay + az * az) / 1024

        if (mag > peakG) {
            peakG = mag
        }

        // START: free-fall begins (near-zero g) — this is the release
        if (!inFreefall && !landed && mag < 0.4) {
            inFreefall = true
            freefallStart = input.runningTime()
            basic.showLeds(`
                . . . . .
                . . . . .
                . . # . .
                . . . . .
                . . . . .
                `)
        }

        // RUNNING: clock advances only during free-fall
        if (inFreefall && !landed) {
            fallTime = input.runningTime() - freefallStart

            // STOP: free-fall ends (g climbs back up) — landing/deceleration
            if (mag > 1.5) {
                landed = true
                inFreefall = false
                basic.showIcon(IconNames.Skull)
            }
        }

        datalogger.log(
            datalogger.createCV("drop", dropNum),
            datalogger.createCV("time_ms", fallTime),
            datalogger.createCV("g", Math.round(mag * 100) / 100),
            datalogger.createCV("peak_g", Math.round(peakG * 100) / 100)
        )

        radio.sendValue("t", fallTime)
        radio.sendValue("g", Math.round(mag * 100))
        radio.sendValue("pk", Math.round(peakG * 100))
    }
    basic.pause(50)
})
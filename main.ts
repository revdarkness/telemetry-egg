// ===== SENDER =====
radio.setGroup(42)
radio.setTransmitPower(7)
let dropping = false
let startTime = 0
let peakG = 0

// Press A to ARM and start the drop
input.onButtonPressed(Button.A, function () {
    dropping = true
    startTime = input.runningTime()
    peakG = 0
    basic.showIcon(IconNames.Yes)
})

// Press B to reset
input.onButtonPressed(Button.B, function () {
    dropping = false
    peakG = 0
    basic.showString("R")
})

basic.forever(function () {
    if (dropping) {
        // total acceleration magnitude in g (1024 mg = 1 g)
        let ax = input.acceleration(Dimension.X)
        let ay = input.acceleration(Dimension.Y)
        let az = input.acceleration(Dimension.Z)
        let mag = Math.sqrt(ax * ax + ay * ay + az * az) / 1024
        let t = input.runningTime() - startTime

        if (mag > peakG) {
            peakG = mag
        }

        // send: elapsed ms, current g x100, peak g x100
        radio.sendValue("t", t)
        radio.sendValue("g", Math.round(mag * 100))
        radio.sendValue("pk", Math.round(peakG * 100))

        // free-fall detection: near-zero g
        if (mag < 0.3) {
            basic.showLeds(`
                . . . . .
                . . . . .
                . . # . .
                . . . . .
                . . . . .
                `)
        } else if (mag > 3) {
            // impact spike
            basic.showIcon(IconNames.Skull)
        }
    }
    basic.pause(50)
})
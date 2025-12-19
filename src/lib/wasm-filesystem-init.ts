/**
 * Auto-generated filesystem initialization
 *
 * Generated from otium/os/fs-in directory
 * Run 'just update-fs-init' to regenerate
 */

export interface FsInitFile {
  path: string;
  content: string;
}

export const FS_INIT_FILES: FsInitFile[] = [
  {
    path: "/FIB.TCL",
    content: `proc fib {x} {
    if {<= \$x 1} {
        return 1
    } else {
        + [fib [- \$x 1]] [fib [- \$x 2]]
    }
}

puts [fib 10]
`,
  },
  {
    path: "/gfx1.tcl",
    content: `# gfxdemomini.tcl
# minimal graphical demo

set uishell_output_to_console 1

gfx/loop 60 {
  gfx/rect [hex 0000ffff] 0 0 1024 670
  gfx/loop-iter
}
`,
  },
  {
    path: "/gfxdemo.tcl",
    content: `# gfxdemo.tcl - an example graphical demo
gfx/init

set width 1024
set height 670

puts "gfxdemo starting"

proc main {} {
  # draw a blue background
  gfx/rect 0000ff 0 0 \$width \$height
  gfx/draw-text 5 5 12 "Wut" 
}

# try for 60 fps 
gfx/loop main 60
`,
  },
  {
    path: "/lorem8k.txt",
    content: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud ex`,
  },
  {
    path: "/mandel.tcl",
    content: `# mandelbrot.tcl - Render Mandelbrot set using fixed-point arithmetic
# Scale factor: 256 (8-bit fixed point)

set uishell_output_to_console 1

set MAX_ITER 32
set WIDTH 128
set HEIGHT 100

# Mandelbrot bounds in fixed-point (scaled by 256):
# Real: -2.0 to 2.0  => -512 to 512 (doubled X_MAX)
# Imag: -1.0 to 1.0  => -256 to 256
set X_MIN -512
set X_MAX 512
set Y_MIN -256
set Y_MAX 256

# Fixed-point multiply: (a * b) >> 8  (divide by 256)
proc fpmul {a b} {
  return [>> [* \$a \$b] 8]
}

# Color palette - map iteration to BGRA color
proc get_color {iter max_iter} {
  if {== \$iter \$max_iter} {
    return [hex ff000000]
  }
  # Simple color gradient based on iteration
  set t [% \$iter 16]
  set r [* \$t 16]
  set g [* [% \$iter 8] 32]
  set b [- 255 [* \$t 8]]
  # Pack as 0xAABBGGRR
  return [+ [hex ff000000] [+ [<< \$b 16] [+ [<< \$g 8] \$r]]]
}

proc draw_mandelbrot {} {
  # Calculate centering offset (assuming 640x480 framebuffer)
  set FB_WIDTH 640
  set FB_HEIGHT 480
  set OFFSET_X [/ [- \$FB_WIDTH \$WIDTH] 2]
  set OFFSET_Y [/ [- \$FB_HEIGHT \$HEIGHT] 2]

  ot_yield
  set x_range [- \$X_MAX \$X_MIN]
  set y_range [- \$Y_MAX \$Y_MIN]

  # Show initial status message
  gfx/text "Rendering Mandelbrot..." 10 10 [hex ffffffff]
  gfx/flush

  set py 0
  while {< \$py \$HEIGHT} {
    ot_yield
    # Map py to imaginary coordinate (fixed-point)
    set c_imag [+ \$Y_MIN [/ [* \$py \$y_range] \$HEIGHT]]

    set px 0
    while {< \$px \$WIDTH} {
      # Map px to real coordinate (fixed-point)
      set c_real [+ \$X_MIN [/ [* \$px \$x_range] \$WIDTH]]

      # z = 0 + 0i
      set zr 0
      set zi 0
      set iter 0

      # Iterate: z = z^2 + c until escape or max iterations
      while {< \$iter \$MAX_ITER} {
        set zr_sq [fpmul \$zr \$zr]
        set zi_sq [fpmul \$zi \$zi]

        # Escape: |z|^2 > 4 => (zr^2 + zi^2) > 4*256 = 1024
        if {> [+ \$zr_sq \$zi_sq] 1024} {
          break
        }

        # z_new = zr^2 - zi^2 + cr, 2*zr*zi + ci
        set zi_new [+ [fpmul [<< \$zr 1] \$zi] \$c_imag]
        set zr [+ [- \$zr_sq \$zi_sq] \$c_real]
        set zi \$zi_new

        set iter [+ \$iter 1]
      }

      # Draw pixel centered on screen
      gfx/pixel [get_color \$iter \$MAX_ITER] [+ \$px \$OFFSET_X] [+ \$py \$OFFSET_Y]
      set px [+ \$px 1]
    }

    # Flush after each line so user sees progressive rendering
    gfx/flush
    set py [+ \$py 1]
  }

  # Show completion message
  gfx/text "Rendering complete!" 10 10 [hex ffffffff]
  gfx/flush
}

# Render once, then keep looping to maintain the display
set rendered 0
gfx/loop 60 {
  if {== \$rendered 0} {
    # Clear to black background
    gfx/rect [hex ff000000] 0 0 640 480
    draw_mandelbrot
    set rendered 1
  }
  gfx/loop-iter
}
`,
  },
  {
    path: "/shellrc.tcl",
    content: `# Shell startup script
# This file is compiled into the shell and executed at startup

puts "shellrc loaded"

# on startup
if {! \$features_ui} {
  # run scratch
  run uishell
}
`,
  },
  {
    path: "/simple.tcl",
    content: `set uishell_output_to_console 1
set X_MAX 256

proc test {} {
  puts \$X_MAX
}

test
`,
  }
];

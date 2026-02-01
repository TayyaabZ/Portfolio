import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation


def animate_seek_sequence(
    seek_sequence: list[int],
    disk_size: int,
    movements: list[int],
    algorithm_name: str = "Disk Scheduling",
    interval_ms: int = 500
) -> None:
    """
    Animate disk head movement based on a seek sequence.

    Creates a line plot that progressively draws the head movement path,
    highlighting the current position at each step.

    Args:
        seek_sequence: Ordered list of track numbers visited by the disk head.
                       First element is the initial head position.
        disk_size: Total number of tracks on the disk (Y-axis range: 0 to disk_size-1).
        movements: Absolute head movements between consecutive tracks (unused here,
                   but available for future timing-based animation).
        algorithm_name: Name of the algorithm (displayed in title).
        interval_ms: Delay between animation frames in milliseconds.

    Returns:
        None. Displays the animation in a matplotlib window.
    """
    # Validate input - return silently if empty
    if not seek_sequence:
        return

    # Number of steps in the animation (including initial position)
    n_steps = len(seek_sequence)

    # X-axis: execution steps (0, 1, 2, ...)
    steps = list(range(n_steps))

    # ─────────────────────────────────────────────────────────────
    # FIGURE SETUP
    # ─────────────────────────────────────────────────────────────
    fig, ax = plt.subplots(figsize=(10, 6))

    # Set axis limits
    ax.set_xlim(-0.5, n_steps - 0.5)
    ax.set_ylim(-5, disk_size + 4)  # Small padding for visibility

    # Labels and title
    ax.set_xlabel("Execution Step", fontsize=12)
    ax.set_ylabel("Track Number", fontsize=12)
    ax.set_title(f"{algorithm_name} - Disk Head Movement", fontsize=14, fontweight='bold')

    # Grid for readability
    ax.grid(True, linestyle='--', alpha=0.6)

    # ─────────────────────────────────────────────────────────────
    # PLOT ELEMENTS (initialized empty, updated during animation)
    # ─────────────────────────────────────────────────────────────

    # Line showing the path traveled so far
    line, = ax.plot([], [], 'b-o', linewidth=2, markersize=6, label="Seek Path")

    # Marker highlighting the current head position
    current_marker, = ax.plot([], [], 'ro', markersize=12, label="Current Head")

    # Text annotation showing current track number
    track_text = ax.text(0, 0, '', fontsize=10, ha='left', va='bottom',
                         bbox=dict(boxstyle='round', facecolor='yellow', alpha=0.8))

    # Legend
    ax.legend(loc='upper right')

    # ─────────────────────────────────────────────────────────────
    # ANIMATION FUNCTIONS
    # ─────────────────────────────────────────────────────────────

    def init():
        """Initialize animation with empty elements."""
        line.set_data([], [])
        current_marker.set_data([], [])
        track_text.set_text('')
        return line, current_marker, track_text

    def update(frame):
        """
        Update function called for each animation frame.

        Args:
            frame: Current frame index (0 to n_steps - 1)

        Returns:
            Tuple of artists to redraw.
        """
        # Data up to current frame (inclusive)
        x_data = steps[:frame + 1]
        y_data = seek_sequence[:frame + 1]

        # Update the line (path traveled so far)
        line.set_data(x_data, y_data)

        # Update current head position marker
        current_x = steps[frame]
        current_y = seek_sequence[frame]
        current_marker.set_data([current_x], [current_y])

        # Update track annotation
        track_text.set_position((current_x + 0.15, current_y + 2))
        track_text.set_text(f"Track: {current_y}")

        return line, current_marker, track_text

    # ─────────────────────────────────────────────────────────────
    # RUN ANIMATION
    # ─────────────────────────────────────────────────────────────

    # Create animation
    # frames: iterate through each step (0 to n_steps - 1)
    # interval: time between frames in milliseconds
    # blit: optimize drawing by only redrawing changed elements
    # repeat: whether to loop the animation
    anim = FuncAnimation(
        fig,
        update,
        frames=n_steps,
        init_func=init,
        interval=interval_ms,
        blit=True,
        repeat=False
    )

    # Display the plot (blocks until window is closed)
    plt.tight_layout()
    plt.show()

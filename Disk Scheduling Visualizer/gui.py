import tkinter as tk
from tkinter import ttk, messagebox

# Import project modules
from algorithms import get_seek_sequence, ALGORITHMS
from metrics import calculate_thm, calculate_movements
from animator import animate_seek_sequence


class DiskSchedulerGUI:
    """
    Main GUI class for the Disk Scheduling Visualizer.
    
    Attributes:
        root: Tkinter root window.
        seek_sequence: Stored seek sequence from last simulation.
        movements: Stored movements from last simulation.
        disk_size_value: Stored disk size from last simulation.
        algorithm_name: Stored algorithm name from last simulation.
    """

    def __init__(self, root: tk.Tk):
        """
        Initialize the GUI.

        Args:
            root: Tkinter root window.
        """
        self.root = root
        self.root.title("Disk Scheduling Visualizer")
        self.root.geometry("550x550")
        self.root.resizable(False, False)

        # ─────────────────────────────────────────────────────────
        # INTERNAL STATE
        # ─────────────────────────────────────────────────────────
        # Stores the result of the last simulation
        self.seek_sequence = None
        self.movements = None
        self.disk_size_value = None
        self.algorithm_name = None

        # ─────────────────────────────────────────────────────────
        # BUILD GUI
        # ─────────────────────────────────────────────────────────
        self._create_input_frame()
        self._create_button_frame()
        self._create_slider_frame()  # Animation speed slider
        self._create_result_frame()
        self._setup_keyboard_shortcuts()  # Keyboard bindings

    # ═══════════════════════════════════════════════════════════════
    # GUI CONSTRUCTION
    # ═══════════════════════════════════════════════════════════════

    def _create_input_frame(self) -> None:
        """Create the input section with labels and entry fields."""
        # Frame for inputs
        input_frame = ttk.LabelFrame(self.root, text="Input Parameters", padding=(15, 10))
        input_frame.pack(fill="x", padx=15, pady=10)

        # ─────────────────────────────────────────────────────────
        # REQUEST QUEUE
        # ─────────────────────────────────────────────────────────
        ttk.Label(input_frame, text="Request Queue (comma-separated):").grid(
            row=0, column=0, sticky="w", pady=5
        )
        self.queue_entry = ttk.Entry(input_frame, width=40)
        self.queue_entry.grid(row=0, column=1, pady=5, padx=5)
        self.queue_entry.insert(0, "82,170,43,140,24,16,190")  # Example placeholder

        # ─────────────────────────────────────────────────────────
        # INITIAL HEAD POSITION
        # ─────────────────────────────────────────────────────────
        ttk.Label(input_frame, text="Initial Head Position:").grid(
            row=1, column=0, sticky="w", pady=5
        )
        self.head_entry = ttk.Entry(input_frame, width=40)
        self.head_entry.grid(row=1, column=1, pady=5, padx=5)
        self.head_entry.insert(0, "50")  # Example placeholder

        # ─────────────────────────────────────────────────────────
        # DISK SIZE
        # ─────────────────────────────────────────────────────────
        ttk.Label(input_frame, text="Disk Size (number of tracks):").grid(
            row=2, column=0, sticky="w", pady=5
        )
        self.disk_size_entry = ttk.Entry(input_frame, width=40)
        self.disk_size_entry.grid(row=2, column=1, pady=5, padx=5)
        self.disk_size_entry.insert(0, "200")  # Example placeholder

        # ─────────────────────────────────────────────────────────
        # DIRECTION
        # ─────────────────────────────────────────────────────────
        ttk.Label(input_frame, text="Direction:").grid(
            row=3, column=0, sticky="w", pady=5
        )
        self.direction_var = tk.StringVar(value="right")
        direction_frame = ttk.Frame(input_frame)
        direction_frame.grid(row=3, column=1, sticky="w", pady=5, padx=5)
        ttk.Radiobutton(direction_frame, text="Left (toward 0)", 
                        variable=self.direction_var, value="left").pack(side="left", padx=5)
        ttk.Radiobutton(direction_frame, text="Right (toward max)", 
                        variable=self.direction_var, value="right").pack(side="left", padx=5)

        # ─────────────────────────────────────────────────────────
        # ALGORITHM SELECTION
        # ─────────────────────────────────────────────────────────
        ttk.Label(input_frame, text="Algorithm:").grid(
            row=4, column=0, sticky="w", pady=5
        )
        self.algorithm_var = tk.StringVar(value="FCFS")
        self.algorithm_dropdown = ttk.Combobox(
            input_frame,
            textvariable=self.algorithm_var,
            values=list(ALGORITHMS.keys()),
            state="readonly",
            width=37
        )
        self.algorithm_dropdown.grid(row=4, column=1, pady=5, padx=5)

    def _create_button_frame(self) -> None:
        """Create the button section."""
        # Frame for buttons
        button_frame = ttk.Frame(self.root, padding=(15, 10))
        button_frame.pack(fill="x", padx=15)

        # Run Simulation button
        self.run_btn = ttk.Button(
            button_frame,
            text="Run Simulation",
            command=self._on_run_simulation,
            width=18
        )
        self.run_btn.pack(side="left", padx=5)

        # Calculate THM button
        self.thm_btn = ttk.Button(
            button_frame,
            text="Calculate THM",
            command=self._on_calculate_thm,
            width=18
        )
        self.thm_btn.pack(side="left", padx=5)

        # Show Animation button
        self.animate_btn = ttk.Button(
            button_frame,
            text="Show Animation",
            command=self._on_show_animation,
            width=18
        )
        self.animate_btn.pack(side="left", padx=5)

    def _create_slider_frame(self) -> None:
        """
        Create the animation speed slider section.
        
        Slider allows user to control animation interval (100-2000 ms).
        """
        # ─────────────────────────────────────────────────────────
        # ANIMATION SPEED SLIDER
        # ─────────────────────────────────────────────────────────
        slider_frame = ttk.Frame(self.root, padding=(15, 5))
        slider_frame.pack(fill="x", padx=15)

        # Label for slider
        ttk.Label(slider_frame, text="Animation Speed (ms per step):").pack(side="left")

        # Variable to store slider value
        self.speed_var = tk.IntVar(value=500)

        # Slider: 100ms (fast) to 2000ms (slow)
        self.speed_slider = ttk.Scale(
            slider_frame,
            from_=100,
            to=2000,
            orient="horizontal",
            variable=self.speed_var,
            length=250
        )
        self.speed_slider.pack(side="left", padx=10)

        # Label to display current value
        self.speed_value_label = ttk.Label(slider_frame, text="500 ms")
        self.speed_value_label.pack(side="left")

        # Update label when slider moves
        def update_speed_label(*args):
            self.speed_value_label.config(text=f"{self.speed_var.get()} ms")
        
        self.speed_var.trace_add("write", update_speed_label)

    def _setup_keyboard_shortcuts(self) -> None:
        """
        Set up keyboard shortcuts for common actions.
        
        Shortcuts:
        - Enter: Run Simulation
        - Ctrl+T: Calculate THM
        - Ctrl+A: Show Animation
        """
        # ─────────────────────────────────────────────────────────
        # KEYBOARD SHORTCUTS
        # ─────────────────────────────────────────────────────────
        
        # Enter key → Run Simulation (works globally)
        self.root.bind("<Return>", lambda event: self._on_run_simulation())
        
        # Ctrl+T → Calculate THM
        self.root.bind("<Control-t>", lambda event: self._on_calculate_thm())
        self.root.bind("<Control-T>", lambda event: self._on_calculate_thm())
        
        # Ctrl+A → Show Animation
        self.root.bind("<Control-a>", lambda event: self._on_show_animation())
        self.root.bind("<Control-A>", lambda event: self._on_show_animation())

    def _create_result_frame(self) -> None:
        """Create the result display section."""
        # Frame for results
        result_frame = ttk.LabelFrame(self.root, text="Results", padding=(15, 10))
        result_frame.pack(fill="both", expand=True, padx=15, pady=10)

        # ─────────────────────────────────────────────────────────
        # SEEK SEQUENCE DISPLAY
        # ─────────────────────────────────────────────────────────
        ttk.Label(result_frame, text="Seek Sequence:").grid(
            row=0, column=0, sticky="nw", pady=5
        )
        
        # Text widget with scrollbar for long sequences
        seq_frame = ttk.Frame(result_frame)
        seq_frame.grid(row=0, column=1, sticky="ew", pady=5, padx=5)
        
        self.sequence_text = tk.Text(seq_frame, height=4, width=45, wrap="word", state="disabled")
        seq_scrollbar = ttk.Scrollbar(seq_frame, orient="vertical", command=self.sequence_text.yview)
        self.sequence_text.configure(yscrollcommand=seq_scrollbar.set)
        self.sequence_text.pack(side="left", fill="both", expand=True)
        seq_scrollbar.pack(side="right", fill="y")

        # ─────────────────────────────────────────────────────────
        # TOTAL HEAD MOVEMENT DISPLAY
        # ─────────────────────────────────────────────────────────
        ttk.Label(result_frame, text="Total Head Movement:").grid(
            row=1, column=0, sticky="w", pady=5
        )
        self.thm_label = ttk.Label(result_frame, text="—", font=("Helvetica", 12, "bold"))
        self.thm_label.grid(row=1, column=1, sticky="w", pady=5, padx=5)

        # ─────────────────────────────────────────────────────────
        # STATUS DISPLAY
        # ─────────────────────────────────────────────────────────
        ttk.Label(result_frame, text="Status:").grid(
            row=2, column=0, sticky="w", pady=5
        )
        self.status_label = ttk.Label(result_frame, text="Ready", foreground="gray")
        self.status_label.grid(row=2, column=1, sticky="w", pady=5, padx=5)

    # ═══════════════════════════════════════════════════════════════
    # INPUT VALIDATION
    # ═══════════════════════════════════════════════════════════════

    def _validate_inputs(self) -> tuple[list[int], int, int, str] | None:
        """
        Validate all user inputs.

        Returns:
            Tuple of (requests, head, disk_size, direction) if valid.
            None if validation fails (error message shown).
        """
        # ─────────────────────────────────────────────────────────
        # VALIDATE REQUEST QUEUE
        # ─────────────────────────────────────────────────────────
        queue_str = self.queue_entry.get().strip()
        if not queue_str:
            self.status_label.config(text="Error: Empty request queue", foreground="red")
            messagebox.showerror("Input Error", "Request queue cannot be empty.")
            return None

        try:
            # Parse comma-separated integers
            requests = [int(x.strip()) for x in queue_str.split(",") if x.strip()]
            if not requests:
                self.status_label.config(text="Error: Empty request queue", foreground="red")
                messagebox.showerror("Input Error", "Request queue must contain at least one track.")
                return None
        except ValueError:
            self.status_label.config(text="Error: Invalid request queue", foreground="red")
            messagebox.showerror("Input Error", "Request queue must contain only integers separated by commas.")
            return None

        # ─────────────────────────────────────────────────────────
        # VALIDATE DISK SIZE
        # ─────────────────────────────────────────────────────────
        try:
            disk_size = int(self.disk_size_entry.get().strip())
            if disk_size <= 0:
                self.status_label.config(text="Error: Invalid disk size", foreground="red")
                messagebox.showerror("Input Error", "Disk size must be a positive integer.")
                return None
        except ValueError:
            self.status_label.config(text="Error: Invalid disk size", foreground="red")
            messagebox.showerror("Input Error", "Disk size must be a valid integer.")
            return None

        # ─────────────────────────────────────────────────────────
        # VALIDATE INITIAL HEAD POSITION
        # ─────────────────────────────────────────────────────────
        try:
            head = int(self.head_entry.get().strip())
            if head < 0 or head >= disk_size:
                self.status_label.config(text="Error: Head out of range", foreground="red")
                messagebox.showerror("Input Error", f"Initial head must be between 0 and {disk_size - 1}.")
                return None
        except ValueError:
            self.status_label.config(text="Error: Invalid head position", foreground="red")
            messagebox.showerror("Input Error", "Initial head position must be a valid integer.")
            return None

        # ─────────────────────────────────────────────────────────
        # VALIDATE REQUEST TRACKS ARE WITHIN DISK RANGE
        # ─────────────────────────────────────────────────────────
        for track in requests:
            if track < 0 or track >= disk_size:
                self.status_label.config(text=f"Error: Track {track} out of range", foreground="red")
                messagebox.showerror(
                    "Input Error", 
                    f"Track {track} is out of range. Must be between 0 and {disk_size - 1}."
                )
                return None

        # ─────────────────────────────────────────────────────────
        # GET DIRECTION
        # ─────────────────────────────────────────────────────────
        direction = self.direction_var.get()

        return requests, head, disk_size, direction

    # ═══════════════════════════════════════════════════════════════
    # EVENT HANDLERS
    # ═══════════════════════════════════════════════════════════════

    def _on_run_simulation(self) -> None:
        """
        Handle "Run Simulation" button click.
        
        Validates inputs, computes seek sequence using algorithms.py,
        and stores the result internally.
        """
        # Validate inputs
        result = self._validate_inputs()
        if result is None:
            return

        requests, head, disk_size, direction = result
        algorithm = self.algorithm_var.get()

        # ─────────────────────────────────────────────────────────
        # COMPUTE SEEK SEQUENCE (via algorithms.py)
        # ─────────────────────────────────────────────────────────
        try:
            self.seek_sequence = get_seek_sequence(algorithm, requests, head, disk_size, direction)
            self.movements = calculate_movements(self.seek_sequence)
            self.disk_size_value = disk_size
            self.algorithm_name = algorithm
        except Exception as e:
            self.status_label.config(text="Error: Algorithm failed", foreground="red")
            messagebox.showerror("Algorithm Error", f"Failed to compute seek sequence:\n{e}")
            return

        # ─────────────────────────────────────────────────────────
        # UPDATE DISPLAY
        # ─────────────────────────────────────────────────────────
        # Format seek sequence for display
        seq_str = " → ".join(str(t) for t in self.seek_sequence)
        
        # Update sequence text widget
        self.sequence_text.configure(state="normal")
        self.sequence_text.delete("1.0", tk.END)
        self.sequence_text.insert("1.0", seq_str)
        self.sequence_text.configure(state="disabled")

        # Reset THM display (user must click Calculate THM)
        self.thm_label.config(text="—")

        # Update status
        self.status_label.config(text=f"Simulation complete ({algorithm})", foreground="green")

    def _on_calculate_thm(self) -> None:
        """
        Handle "Calculate THM" button click.
        
        Calculates Total Head Movement using metrics.py and displays result.
        """
        # Check if simulation has been run
        if self.seek_sequence is None:
            self.status_label.config(text="Error: No simulation data", foreground="red")
            messagebox.showwarning("Warning", "Please run simulation first.")
            return

        # ─────────────────────────────────────────────────────────
        # CALCULATE THM (via metrics.py)
        # ─────────────────────────────────────────────────────────
        thm = calculate_thm(self.seek_sequence)

        # Update display (Blue → THM calculated)
        self.thm_label.config(text=f"{thm} tracks")
        self.status_label.config(text="THM calculated", foreground="blue")

    def _on_show_animation(self) -> None:
        """
        Handle "Show Animation" button click.
        
        Triggers animation using animator.py with the stored seek sequence.
        Uses the current slider value for animation interval.
        """
        # Check if simulation has been run
        if self.seek_sequence is None:
            self.status_label.config(text="Error: No simulation data", foreground="red")
            messagebox.showwarning("Warning", "Please run simulation first.")
            return

        # Get animation speed from slider
        interval_ms = self.speed_var.get()

        # Update status (Purple → Animation in progress)
        self.status_label.config(text="Showing animation...", foreground="purple")
        self.root.update()

        # ─────────────────────────────────────────────────────────
        # SHOW ANIMATION (via animator.py)
        # ─────────────────────────────────────────────────────────
        animate_seek_sequence(
            seek_sequence=self.seek_sequence,
            disk_size=self.disk_size_value,
            movements=self.movements,
            algorithm_name=self.algorithm_name,
            interval_ms=interval_ms  # Read from slider
        )

        # Update status after animation window closes
        self.status_label.config(text="Animation closed", foreground="gray")


def main() -> None:
    """
    Entry point for the GUI application.
    
    Creates the Tkinter root window and starts the main event loop.
    """
    root = tk.Tk()
    app = DiskSchedulerGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()

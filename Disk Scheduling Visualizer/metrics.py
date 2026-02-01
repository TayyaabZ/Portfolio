def calculate_thm(seek_sequence: list[int]) -> int:
    """
    Calculate Total Head Movement (THM) from a seek sequence.
    
    THM is the sum of absolute differences between consecutive track positions:
        THM = Σ |current_track - previous_track|
    
    Args:
        seek_sequence: List of track numbers in order of access.
                       First element is the initial head position.
    
    Returns:
        Total head movement as an integer.
    
    Example:
        seek_sequence = [50, 82, 170, 43]
        THM = |82-50| + |170-82| + |43-170|
            = 32 + 88 + 127
            = 247
    """
    # Empty or single-element sequence has no movement
    if len(seek_sequence) <= 1:
        return 0
    
    # Sum of absolute differences between consecutive positions
    total = 0
    for i in range(1, len(seek_sequence)):
        movement = abs(seek_sequence[i] - seek_sequence[i - 1])
        total += movement
    
    return total


def calculate_movements(seek_sequence: list[int]) -> list[int]:
    """
    Calculate individual head movements between consecutive tracks.
    
    This function returns the absolute distance traveled at each step,
    useful for animation timing (longer movements = longer animation).
    
    Args:
        seek_sequence: List of track numbers in order of access.
                       First element is the initial head position.
    
    Returns:
        List of absolute movements between consecutive tracks.
        Length is len(seek_sequence) - 1.
        Returns empty list if seek_sequence has fewer than 2 elements.
    
    Example:
        seek_sequence = [50, 82, 170, 43]
        movements = [|82-50|, |170-82|, |43-170|]
                  = [32, 88, 127]
    """
    # Need at least 2 positions to have a movement
    if len(seek_sequence) <= 1:
        return []
    
    # Calculate absolute difference for each consecutive pair
    movements = []
    for i in range(1, len(seek_sequence)):
        movement = abs(seek_sequence[i] - seek_sequence[i - 1])
        movements.append(movement)
    
    return movements

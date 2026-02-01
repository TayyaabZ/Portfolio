def fcfs(requests: list[int], head: int, disk_size: int, direction: str = None) -> list[int]:
    """
    First Come First Serve (FCFS)
    
    Serves requests in the exact order they arrive.
    No optimization - simply process queue sequentially.
    
    Args:
        requests: List of track numbers to service
        head: Initial head position
        disk_size: Total number of tracks (unused, kept for consistent API)
        direction: Unused for FCFS
    
    Returns:
        Seek sequence starting with head, then requests in arrival order
    """
    # Start with initial head position
    seek_sequence = [head]
    
    # FCFS simply appends requests in their original order
    # No sorting, no optimization
    seek_sequence.extend(requests)
    
    return seek_sequence


def sstf(requests: list[int], head: int, disk_size: int, direction: str = None) -> list[int]:
    """
    Shortest Seek Time First (SSTF)
    
    Greedy algorithm that always selects the request closest to current head position.
    Recalculates distances after each movement.
    
    Warning: Can cause starvation for requests far from the head.
    
    Args:
        requests: List of track numbers to service
        head: Initial head position
        disk_size: Total number of tracks (unused, kept for consistent API)
        direction: Unused for SSTF
    
    Returns:
        Seek sequence starting with head, ordered by shortest seek time
    """
    # Start with initial head position
    seek_sequence = [head]
    pending = list(requests)  # Copy to avoid modifying original
    current_head = head
    
    while pending:
        # Find request with minimum distance from current head
        closest_index = 0
        min_distance = abs(pending[0] - current_head)
        
        for i, track in enumerate(pending):
            distance = abs(track - current_head)
            if distance < min_distance:
                min_distance = distance
                closest_index = i
        
        # Service the closest request
        chosen_track = pending.pop(closest_index)
        seek_sequence.append(chosen_track)
        current_head = chosen_track
    
    return seek_sequence


def scan(requests: list[int], head: int, disk_size: int, direction: str) -> list[int]:
    """
    SCAN (Elevator Algorithm)
    
    Head moves in one direction, servicing all requests until reaching disk edge.
    Then reverses direction and services remaining requests.
    
    IMPORTANT: Head MUST visit the disk edge (0 or disk_size-1) before reversing,
    even if no request exists at the edge.
    
    Args:
        requests: List of track numbers to service
        head: Initial head position
        disk_size: Total number of tracks (valid tracks: 0 to disk_size-1)
        direction: "left" (toward 0) or "right" (toward disk_size-1)
    
    Returns:
        Seek sequence starting with head, including edge visits
    """
    # Start with initial head position
    seek_sequence = [head]
    
    # Service any requests at current head position immediately
    at_head = [r for r in requests if r == head]
    
    # Separate remaining requests into left and right of head (strict inequality)
    left = sorted([r for r in requests if r < head], reverse=True)   # Descending (closest first when going left)
    right = sorted([r for r in requests if r > head])                # Ascending (closest first when going right)
    
    # Add requests at head position (no movement needed, but must be in sequence)
    seek_sequence.extend(at_head)
    
    if direction == "left":
        # Move left first: service left requests, hit edge 0, then service right
        seek_sequence.extend(left)
        
        # MUST visit edge 0 - safeguard against redundant visit
        # Only add if not already at 0 and last position isn't 0
        if seek_sequence[-1] != 0:
            seek_sequence.append(0)
        
        # Reverse direction: service right requests
        seek_sequence.extend(right)
    
    else:  # direction == "right"
        # Move right first: service right requests, hit edge, then service left
        seek_sequence.extend(right)
        
        # MUST visit edge (disk_size - 1) - safeguard against redundant visit
        if seek_sequence[-1] != disk_size - 1:
            seek_sequence.append(disk_size - 1)
        
        # Reverse direction: service left requests
        seek_sequence.extend(left)
    
    return seek_sequence


def cscan(requests: list[int], head: int, disk_size: int, direction: str) -> list[int]:
    """
    Circular SCAN (C-SCAN)
    
    Head moves in one direction only, servicing requests.
    Upon reaching disk edge, jumps to opposite edge and continues in SAME direction.
    
    IMPORTANT: 
    - Head MUST visit both edges during the wrap-around.
    - The jump from one edge to the other COUNTS toward THM.
    - No requests are serviced during the jump.
    
    Args:
        requests: List of track numbers to service
        head: Initial head position
        disk_size: Total number of tracks (valid tracks: 0 to disk_size-1)
        direction: "left" (toward 0) or "right" (toward disk_size-1)
    
    Returns:
        Seek sequence starting with head, including both edge visits during wrap-around
    """
    # Start with initial head position
    seek_sequence = [head]
    
    # Service any requests at current head position immediately
    at_head = [r for r in requests if r == head]
    
    # Separate remaining requests into left and right of head (strict inequality)
    left = sorted([r for r in requests if r < head])                 # Ascending (for wrap-around)
    right = sorted([r for r in requests if r > head])                # Ascending
    
    # Add requests at head position
    seek_sequence.extend(at_head)
    
    if direction == "right":
        # Move right: service right requests
        seek_sequence.extend(right)
        
        # Hit right edge - safeguard against redundant visit
        if seek_sequence[-1] != disk_size - 1:
            seek_sequence.append(disk_size - 1)
        
        # Jump to left edge (no servicing during jump, but edge is added)
        # Safeguard: only add if there are left requests to service
        if left:
            seek_sequence.append(0)
            # Continue from left edge toward right, service remaining left requests
            seek_sequence.extend(left)
    
    else:  # direction == "left"
        # Move left: service left requests (descending order)
        seek_sequence.extend(sorted(left, reverse=True))
        
        # Hit left edge - safeguard against redundant visit
        if seek_sequence[-1] != 0:
            seek_sequence.append(0)
        
        # Jump to right edge
        # Safeguard: only add if there are right requests to service
        if right:
            seek_sequence.append(disk_size - 1)
            # Continue from right edge toward left, service remaining right requests
            seek_sequence.extend(sorted(right, reverse=True))
    
    return seek_sequence


def look(requests: list[int], head: int, disk_size: int, direction: str) -> list[int]:
    """
    LOOK Algorithm
    
    Similar to SCAN, but head does NOT go to disk edge unless a request exists there.
    Head reverses direction immediately after servicing the last request in current direction.
    
    Args:
        requests: List of track numbers to service
        head: Initial head position
        disk_size: Total number of tracks (unused, but kept for consistent API)
        direction: "left" (toward 0) or "right" (toward disk_size-1)
    
    Returns:
        Seek sequence starting with head (no forced edge visits)
    """
    # Start with initial head position
    seek_sequence = [head]
    
    # Service any requests at current head position immediately
    at_head = [r for r in requests if r == head]
    
    # Separate remaining requests into left and right of head (strict inequality)
    left = sorted([r for r in requests if r < head], reverse=True)   # Descending
    right = sorted([r for r in requests if r > head])                # Ascending
    
    # Add requests at head position
    seek_sequence.extend(at_head)
    
    if direction == "left":
        # Move left: service left requests (no edge visit)
        seek_sequence.extend(left)
        
        # Reverse: service right requests
        seek_sequence.extend(right)
    
    else:  # direction == "right"
        # Move right: service right requests (no edge visit)
        seek_sequence.extend(right)
        
        # Reverse: service left requests
        seek_sequence.extend(left)
    
    return seek_sequence


def clook(requests: list[int], head: int, disk_size: int, direction: str) -> list[int]:
    """
    Circular LOOK (C-LOOK)
    
    Similar to C-SCAN, but head does NOT go to disk edges.
    After servicing last request in current direction, jumps directly to 
    the first request on the opposite side.
    
    Args:
        requests: List of track numbers to service
        head: Initial head position
        disk_size: Total number of tracks (unused, but kept for consistent API)
        direction: "left" (toward 0) or "right" (toward disk_size-1)
    
    Returns:
        Seek sequence starting with head (no forced edge visits, jump between last and first request)
    """
    # Start with initial head position
    seek_sequence = [head]
    
    # Service any requests at current head position immediately
    at_head = [r for r in requests if r == head]
    
    # Separate remaining requests into left and right of head (strict inequality)
    left = sorted([r for r in requests if r < head])                 # Ascending (for wrap-around)
    right = sorted([r for r in requests if r > head])                # Ascending
    
    # Add requests at head position
    seek_sequence.extend(at_head)
    
    if direction == "right":
        # Move right: service right requests
        seek_sequence.extend(right)
        
        # Jump directly to smallest request (first in left side when sorted ascending)
        # No edge visits - continue servicing from lowest track
        seek_sequence.extend(left)
    
    else:  # direction == "left"
        # Move left: service left requests (descending order)
        seek_sequence.extend(sorted(left, reverse=True))
        
        # Jump directly to largest request on right side
        # No edge visits - continue servicing from highest track going down
        seek_sequence.extend(sorted(right, reverse=True))
    
    return seek_sequence


# Dictionary mapping algorithm names to functions for easy access
ALGORITHMS = {
    "FCFS": fcfs,
    "SSTF": sstf,
    "SCAN": scan,
    "C-SCAN": cscan,
    "LOOK": look,
    "C-LOOK": clook,
}


def get_seek_sequence(algorithm: str, requests: list[int], head: int, 
                      disk_size: int, direction: str = None) -> list[int]:
    """
    Unified interface to get seek sequence from any algorithm.
    
    Args:
        algorithm: Name of algorithm ("FCFS", "SSTF", "SCAN", "C-SCAN", "LOOK", "C-LOOK")
        requests: List of track numbers to service
        head: Initial head position
        disk_size: Total number of tracks
        direction: "left" or "right" (required for SCAN, C-SCAN, LOOK, C-LOOK)
    
    Returns:
        Seek sequence as list of track numbers
    
    Raises:
        ValueError: If algorithm name is invalid
    """
    if algorithm not in ALGORITHMS:
        raise ValueError(f"Unknown algorithm: {algorithm}. Valid options: {list(ALGORITHMS.keys())}")
    
    return ALGORITHMS[algorithm](requests, head, disk_size, direction)

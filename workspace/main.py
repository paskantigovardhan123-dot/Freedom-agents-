

def divide(a: float, b: float) -> float:
    """Return division of a by b. Raises ValueError on zero division."""
    if b == 0:
        raise ValueError('Cannot divide by zero')
    return a / b

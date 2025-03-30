# Message rate limiting configuration
MESSAGE_LIMIT = 10
TIME_FRAME = 'minute'  # Options: 'minute', 'hour', 'day', 'week'

# Time frame in hours mapping
TIME_FRAME_HOURS = {
    'minute': 1/60,
    'hour': 1,
    'day': 24,
    'week': 24 * 7
}

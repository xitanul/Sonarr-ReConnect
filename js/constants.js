/**
 * Constants for Sonarr-ReConnect extension
 */

// Time conversion constants
export const MS_PER_SECOND = 1_000;
export const MS_PER_MINUTE = 60_000;
export const MS_PER_HOUR = 3_600_000;
export const MS_PER_DAY = 86_400_000;

// Series status class mappings
export const SERIES_STATUS_CLASSES = {
    'continuing': 'label success',
    'ended': 'label alert'
};

// Episode status labels
export const EPISODE_STATUS_LABELS = {
    'continuing': 'label regular',
    'ended': 'label success',
    'missing-monitored': 'label alert',
    'missing-not-monitored': 'label warning'
};

// History event type display names
export const HISTORY_EVENT_TYPES = {
    'downloadFolderImported': 'Imported',
    'grabbed': 'Grabbed',
    'downloadFailed': 'Failed'
};

const SAVE_KEY = 'SETTINGS/SAVE_KEY'
const DELETE_KEY = 'SETTINGS/DELETE_KEY'

export const constants = {
    SAVE_KEY,
    DELETE_KEY
}

export function saveKey(key, name) {
    return {
        type: SAVE_KEY,
        key,
        name
    }
}

export function deleteKey(key) {
    return {
        type: DELETE_KEY,
        key
    }
}

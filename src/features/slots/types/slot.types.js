/**
 * Slot Types
 * Type definitions for slot-related data structures
 */

/**
 * @typedef {Object} Slot
 * @property {number} slot_id - Unique identifier
 * @property {string} start_date - Start date (YYYY-MM-DD)
 * @property {string} end_date - End date (YYYY-MM-DD)
 * @property {string} name - Slot name/description
 */

/**
 * @typedef {Object} SlotFormData
 * @property {string} start_date - Start date
 * @property {string} end_date - End date
 * @property {string} name - Slot name
 * @property {string} insertAfter - ID of slot to insert after
 */

/**
 * @typedef {Object} SlotTableColumn
 * @property {string} key - Column identifier
 * @property {string} label - Display label
 * @property {string} width - CSS width
 */

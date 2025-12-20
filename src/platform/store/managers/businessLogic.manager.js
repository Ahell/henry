import {
  DEFAULT_BUSINESS_LOGIC,
  normalizeBusinessLogic,
} from "../../services/business-logic.defaults.js";

export class BusinessLogicManager {
  constructor(events) {
    this.events = events;
    this.businessLogic = DEFAULT_BUSINESS_LOGIC;
  }

  load(businessLogic) {
    this.businessLogic = normalizeBusinessLogic(businessLogic);
  }

  getBusinessLogic() {
    return this.businessLogic || DEFAULT_BUSINESS_LOGIC;
  }

  setBusinessLogic(nextBusinessLogic) {
    this.businessLogic = normalizeBusinessLogic(nextBusinessLogic);
    this.events.notify();
  }
}


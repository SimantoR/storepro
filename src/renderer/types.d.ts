interface AppConfig {
  app: {
    sleepAfter?: number; // seconds
    keyboard: boolean;
    sound: boolean;
  };
  manager: {
    cashDrawer: {
      allowAccess: boolean;
      openOnSale: boolean;
    };
    payment: {
      giftCards: boolean;
      loyaltyCards: boolean;
      USDollar: boolean;
    };
    allowRefunds: boolean;
    allowVoids: boolean;
    printOnSale: boolean;
  };
  sync: {
    syncInterval: number; // minutes
    encrypt: boolean; // takes paid subscription
  };
}

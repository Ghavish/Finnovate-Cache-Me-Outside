// Gives each mock user an Essential / Adjustable / Optional expense list.
// Amounts are the monthly average of their Jun-Sep 2026 transactions.

db.users.updateOne({ userId: "TEST_UID_1" }, { $set: { monthlyExpenses: [
    { name: "Rent", amountCents: 1100000, group: "essential" },
    { name: "Electricity", amountCents: 131300, group: "essential" },
    { name: "Groceries", amountCents: 559000, group: "essential" },
    { name: "Bus / Metro fares", amountCents: 100000, group: "essential" },
    { name: "Phone & internet", amountCents: 119900, group: "essential" },
    { name: "Eating out", amountCents: 84400, group: "adjustable" }
] } });
db.users.updateOne({ userId: "TEST_UID_2" }, { $set: { monthlyExpenses: [
    { name: "Rent", amountCents: 850000, group: "essential" },
    { name: "Electricity", amountCents: 96900, group: "essential" },
    { name: "Groceries", amountCents: 401400, group: "essential" },
    { name: "Bus / Metro fares", amountCents: 80000, group: "essential" },
    { name: "Phone & internet", amountCents: 79900, group: "essential" },
    { name: "Eating out", amountCents: 92000, group: "adjustable" }
] } });
db.users.updateOne({ userId: "TEST_UID_3" }, { $set: { monthlyExpenses: [
    { name: "Rent", amountCents: 1400000, group: "essential" },
    { name: "Electricity", amountCents: 171600, group: "essential" },
    { name: "Groceries", amountCents: 754800, group: "essential" },
    { name: "Fuel", amountCents: 240000, group: "essential" },
    { name: "Phone & internet", amountCents: 99900, group: "essential" },
    { name: "Eating out", amountCents: 75900, group: "adjustable" }
] } });
db.users.updateOne({ userId: "TEST_UID_4" }, { $set: { monthlyExpenses: [
    { name: "Rent", amountCents: 750000, group: "essential" },
    { name: "Electricity", amountCents: 87000, group: "essential" },
    { name: "Groceries", amountCents: 332800, group: "essential" },
    { name: "Bus / Metro fares", amountCents: 70000, group: "essential" },
    { name: "Phone & internet", amountCents: 50000, group: "essential" },
    { name: "Eating out", amountCents: 77600, group: "adjustable" }
] } });

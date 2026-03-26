const RANKS = {
    CEO: 1,
    GM: 2,
    MANAGER: 3,
    HR: 3, // HR is often at manager level for access
    TEAM_LEAD: 4,
    EMPLOYEE: 5
};

const getRank = (roleType) => {
    const role = (roleType || 'employee').toUpperCase();
    return RANKS[role] || RANKS.EMPLOYEE;
};

module.exports = { RANKS, getRank };

export const defaultConfig = {
    showHeader: true,
    nodeCount: {
      min: 0,
      max: 100
    },
    infectedPercentage: {
      min: 0,
      max: 100,
      default: 10
    },
    spreadRates: [
      { id: 'spreadLow', label: 'Low', value: 0.5 },
      { id: 'spreadMedium', label: 'Normal', value: 1 },
      { id: 'spreadHigh', label: 'High', value: 2 }
    ],
    connectionTypes: [
      { id: 'family', label: 'Family', color: '#00ff00', baseProbability: 0.1, attractionStrength: 0.7 },
      { id: 'friends', label: 'Friends', color: '#800080', baseProbability: 0.05, attractionStrength: 0.7 },
      { id: 'workSchool', label: 'Work/School', color: '#0000ff', baseProbability: 0.05, attractionStrength: 0.7 },
      { id: 'strangers', label: 'Strangers', color: '#808080', baseProbability: 0.01, attractionStrength: 0.1 }
    ],
    nodeColors: {
      healthy: '#808080',
      infected: '#ff0000'
    },
    restrictions: [
      {
        id: 'respirators',
        label: 'Respirator usage in public spaces',
        tooltip: 'Friends - majority won\'t follow this restriction.\nSchool/work - helps a bit, people still sit in the same enclosed spaces and are more prone to wear respirators incorrectly at times.\nStrangers - more protected around infected people.',
        multipliers: {
          workSchool: 0.8,
          strangers: 0.5,
          friends: 0.95
        }
      },
      {
        id: 'testing',
        label: 'Antigen testing in schools and workplaces 2x per week',
        tooltip: 'School/work - most cases get caught in time.',
        multipliers: {
          workSchool: 0.5
        }
      },
      {
        id: 'quarantine',
        label: '2 weeks of quarantine after a positive test',
        tooltip: 'Family - minimal effect due to sharing the same living space.\nFriends - mostly eliminated, but could\'ve spread before the test.\nSchool/work - mostly eliminated, but could\'ve spread before the test.\nStrangers - very unlikely to meet an infectious person.',
        multipliers: {
          family: 0.95,
          friends: 0.3,
          workSchool: 0.3,
          strangers: 0.1
        }
      },
      {
        id: 'distancing',
        label: 'Social distancing in public spaces',
        tooltip: 'Friends - majority won\'t follow this restriction.\nStrangers - less interactions with people and safer distances.',
        multipliers: {
          strangers: 0.5,
          friends: 0.95
        }
      },
      {
        id: 'homeoffice',
        label: 'Home office and online school',
        tooltip: 'Family - more time spent around them.\nSchool/work - practically no in-person interactions.\nStrangers - people travel less.',
        multipliers: {
          family: 1.3,
          workSchool: 0.1,
          strangers: 0.3
        }
      },
      {
        id: 'hobbies',
        label: 'Restrictions on hobbies and sports',
        tooltip: 'Friends - less activities to do outside, won\'t stop them from hanging out.\nStrangers - practically no interactions in movies, clubs, etc.',
        multipliers: {
          friends: 0.7,
          strangers: 0.5
        }
      }
    ],
    scenarios: [
      {
        label: "None",
        spreadRate: null,
        restrictions: []
      },
      {
        label: "Non-aggressive virus, no restrictions",
        spreadRate: "spreadLow",
        restrictions: []
      },
      {
        label: "Non-aggressive virus, all restrictions",
        spreadRate: "spreadLow",
        restrictions: ["respirators", "testing", "quarantine", "distancing", "homeoffice", "hobbies"]
      },
      {
        label: "Normal virus, no restrictions",
        spreadRate: "spreadMedium",
        restrictions: []
      },
      {
        label: "Normal virus, moderate restrictions",
        spreadRate: "spreadMedium",
        restrictions: ["respirators", "quarantine", "distancing"]
      },
      {
        label: "Normal virus, all restrictions",
        spreadRate: "spreadMedium",
        restrictions: ["respirators", "testing", "quarantine", "distancing", "homeoffice", "hobbies"]
      },
      {
        label: "Very aggressive virus, no restrictions",
        spreadRate: "spreadHigh",
        restrictions: []
      },
      {
        label: "Very aggressive virus, all restrictions",
        spreadRate: "spreadHigh",
        restrictions: ["respirators", "testing", "quarantine", "distancing", "homeoffice", "hobbies"]
      }
    ]
  };
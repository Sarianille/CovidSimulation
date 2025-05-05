import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SimulationLogic } from '../simulation.js';
import { randomInt, randomBernoulli } from 'd3-random';

const createTestConfig = () => ({
  showHeader: true,
  nodeCount: {
    min: 0,
    max: 100
  },
  infectedPercentage: {
    min: 0,
    max: 100,
    default: 50
  },
  spreadRates: [
    { id: 'spreadLow', label: 'Low', value: 0.5 },
    { id: 'spreadNormal', label: 'Normal', value: 1 }
  ],
  connectionTypes: [
    { id: 'family', label: 'Family', color: '#008000', baseProbability: 0.1, attractionStrength: 0.7 },
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
      }
    },
    {
      id: 'quarantine',
      label: '2 weeks of quarantine after a positive test',
      tooltip: 'Family - minimal effect due to sharing the same living space.\nFriends - mostly eliminated, but could\'ve spread before the test.\nSchool/work - mostly eliminated, but could\'ve spread before the test.\nStrangers - very unlikely to meet an infectious person.',
      multipliers: {
        family: 0.95,
        workSchool: 0.3,
        strangers: 0.1
      }
    }
  ],
  scenarios: [
    {
      label: "Non-aggressive virus, no restrictions",
      spreadRate: "spreadLow",
      restrictions: []
    },
    {
      label: "Normal virus, no restrictions",
      spreadRate: "spreadNormal",
      restrictions: []
    },
    {
      label: "Normal virus, all restrictions",
      spreadRate: "spreadNormal",
      restrictions: ["respirators", "quarantine"]
    }
  ]
});

const testHelpers = {
  createTestNodes: (countOrPattern, infectionStatus = false) => {
    // Create nodes from array of booleans
    if (Array.isArray(countOrPattern)) {
      return countOrPattern.map(infected => ({ infected }));
    }

    // Create a certain number of nodes with the same infection status
    return Array.from({ length: countOrPattern }, () => ({ infected: infectionStatus }));
  },

  createTestLink: (source, target, value = 1, type = 0) => {
    return { source, target, value, type };
  }
};

describe('SimulationLogic', () => {
  let simulationLogic;
  let testConfig;

  beforeEach(() => {
    testConfig = createTestConfig();
    simulationLogic = new SimulationLogic(testConfig, {
      randomInt: randomInt,
      randomBernoulli: randomBernoulli
    });
  });

  describe('resetProbabilities', () => {
    it('should reset all probabilities to base values', () => {
      simulationLogic.probabilities = simulationLogic.probabilities.map(() => 1);

      simulationLogic.resetProbabilities();

      simulationLogic.probabilities.forEach((probability, index) => {
        expect(probability).toBe(testConfig.connectionTypes[index].baseProbability)
      });
    });
  });

  describe('applyRestrictions', () => {
    it('should apply a single restriction correctly', () => {
      simulationLogic.applyRestrictions(['respirators']);

      expect(simulationLogic.probabilities).toEqual([
        0.1, // family
        0.05 * 0.8, // workSchool
        0.01 * 0.5 // strangers
      ])
    });

    it('should apply multiple restrictions correctly', () => {
      simulationLogic.applyRestrictions(['respirators', 'quarantine']);

      expect(simulationLogic.probabilities).toEqual([
        0.1 * 0.95, // family
        0.05 * 0.8 * 0.3, // workSchool
        0.01 * 0.5 * 0.1 // strangers
      ])
    });

    it('should ignore non-existing restrictions', () => {
      simulationLogic.applyRestrictions(['nonExistingRestriction']);

      expect(simulationLogic.probabilities).toEqual([
        0.1, // family
        0.05, // workSchool
        0.01 // strangers
      ])
    });

    it('should handle empty restrictions', () => {
      simulationLogic.applyRestrictions([]);

      expect(simulationLogic.probabilities).toEqual([
        0.1, // family
        0.05, // workSchool
        0.01 // strangers
      ])
    });
  });

  describe('decideNodeCount', () => {
    it('should return provided nodeCount if not zero', () => {
      expect(simulationLogic.decideNodeCount(10)).toBe(10);
    });

    it('should generate a random nodeCount if zero', () => {
      randomInt.mockImplementationOnce((min, max) => () => 50);
      expect(simulationLogic.decideNodeCount(0)).toBe(50);
      expect(randomInt).toHaveBeenCalledWith(1, 100); // min + 1, max
    });
  });

  describe('createNodes', () => {
    it('should create nodes with the specified infected percentage', () => {
      let callCount = 0;
      randomBernoulli.mockImplementation(() => () => {
        callCount++;
        return callCount % 2 === 0; // Every other node is infected
      });

      simulationLogic.createNodes(10, 0.5);

      const infectedCount = simulationLogic.nodes.filter(node => node.infected).length;

      expect(simulationLogic.nodes.length).toBe(10);
      expect(infectedCount).toBe(5);
    });
  });

  describe('createLinks', () => {
    it('should create the correct number of links', () => {
      simulationLogic.nodes = testHelpers.createTestNodes(5);

      let callCount = 0;
      randomInt.mockImplementation((min, max) => () => {
        callCount++;
        
        // Ensure that the source and target are different nodes
        if (callCount % 3 === 1) return callCount % 5; // source
        if (callCount % 3 === 2) return (callCount + 1) % 5; // target
        return 0; // type
      });

      simulationLogic.createLinks(5);

      expect(simulationLogic.links.length).toBe(10);
    });

    it('should avoid self-links', () => {
      simulationLogic.nodes = testHelpers.createTestNodes(3);

      let callCount = 0;
      randomInt.mockImplementation((min, max) => () => {
        callCount++;
        // Make source and target the same at first, then different
        return callCount < 3 ? 0 : callCount % 3;
      });

      simulationLogic.createLinks(3);

      simulationLogic.links.forEach(link => {
        expect(link.source).not.toBe(link.target);
      });
    });

    it('should not create links if nodeCount < 2', () => {
      simulationLogic.createLinks(1);
      expect(simulationLogic.links.length).toBe(0);
    });

    it('should set link values correctly', () => {
      simulationLogic.nodes = testHelpers.createTestNodes([true, false, false]);

      let callCount = 0;
      randomInt.mockImplementation((min, max) => () => {
        // Create links 0<->1, 1<->2
        const values = [0, 1, 0, 1, 2, 1];
        return values[callCount++ % values.length];
      });

      simulationLogic.createLinks(3);

      // Switching between infected and healthy links
      const expected = [3, 1, 3, 1, 3, 1];
      simulationLogic.links.forEach((link, index) => {
        expect(link.value).toBe(expected[index]);
      });
    });
  });

  describe('deleteUnlinkedNodes', () => {
    it('should remove unlinked nodes', () => {
      simulationLogic.nodes = testHelpers.createTestNodes(3);
      simulationLogic.links = [testHelpers.createTestLink(0, 1)];

      simulationLogic.deleteUnlinkedNodes();

      expect(simulationLogic.nodes.length).toBe(2);
    });

    it('should re-index link nodes after removing unlinked nodes', () => {
      simulationLogic.nodes = testHelpers.createTestNodes(3);
      simulationLogic.links = [testHelpers.createTestLink(0, 2)];

      simulationLogic.deleteUnlinkedNodes();

      expect(simulationLogic.links[0].source).toBe(0);
      expect(simulationLogic.links[0].target).toBe(1);
    });
  });

  describe('tryInfect', () => {
    it('should not infect already infected nodes', () => {
      const node = { infected: true };
      const result = simulationLogic.tryInfect(node, 1, 1);

      expect(result).toBe(false);
      expect(node.infected).toBe(true);
    });

    it('should infect based on probability', () => {
      const nodes = testHelpers.createTestNodes(2);

      randomBernoulli
        .mockImplementationOnce(() => () => true)
        .mockImplementationOnce(() => () => false);

      const result1 = simulationLogic.tryInfect(nodes[0], 1, 1);
      const result2 = simulationLogic.tryInfect(nodes[1], 1, 1);

      expect(result1).toBe(true);
      expect(nodes[0].infected).toBe(true);
      expect(result2).toBe(false);
      expect(nodes[1].infected).toBe(false);
    });

    it('should combine probabilities and spread rates correctly', () => {
      const node = { infected: false };

      simulationLogic.tryInfect(node, 0.5, 0.4);

      expect(randomBernoulli).toHaveBeenCalledWith(0.5 * 0.4);
    });
  });

  describe('spreadInfection', () => {
    it('should spread infection only to neighbours', () => {
      simulationLogic.nodes = testHelpers.createTestNodes([true, false, false, false, false]);

      simulationLogic.links = [
        testHelpers.createTestLink(simulationLogic.nodes[0], simulationLogic.nodes[1], 3),
        testHelpers.createTestLink(simulationLogic.nodes[0], simulationLogic.nodes[2], 3),
        testHelpers.createTestLink(simulationLogic.nodes[1], simulationLogic.nodes[3]),
        testHelpers.createTestLink(simulationLogic.nodes[2], simulationLogic.nodes[4])
      ];

      randomBernoulli.mockImplementation(() => () => true);
      const newlyInfected = simulationLogic.spreadInfection();

      expect(newlyInfected).toBe(2);
      expect(simulationLogic.nodes[0].infected).toBe(true);
      // Spread to neighbours
      expect(simulationLogic.nodes[1].infected).toBe(true);
      expect(simulationLogic.nodes[2].infected).toBe(true);
      // No spread to neighbours of neighbours
      expect(simulationLogic.nodes[3].infected).toBe(false);
      expect(simulationLogic.nodes[4].infected).toBe(false);
    });

    it('should handle infections from either sides', () => {
      simulationLogic.nodes = testHelpers.createTestNodes([false, true, false]);
      simulationLogic.links = [
        testHelpers.createTestLink(simulationLogic.nodes[0], simulationLogic.nodes[1], 3),
        testHelpers.createTestLink(simulationLogic.nodes[1], simulationLogic.nodes[2], 3)
      ];

      randomBernoulli.mockImplementation(() => () => true);

      const newlyInfected = simulationLogic.spreadInfection();

      expect(newlyInfected).toBe(2);
      // Spread from target to source
      expect(simulationLogic.nodes[0].infected).toBe(true);
      // Spread from source to target
      expect(simulationLogic.nodes[2].infected).toBe(true);
    });

    it('should end the simulation if all nodes are infected', () => {
      simulationLogic.nodes = testHelpers.createTestNodes(3, true);
      simulationLogic.intervalID = 1;

      const result = simulationLogic.spreadInfection();

      expect(result).toBe(-1);
      expect(global.clearInterval).toHaveBeenCalledWith(1);
    });

    it('should update link values correctly', () => {
      simulationLogic.nodes = testHelpers.createTestNodes([true, false, false]);
      simulationLogic.links = [
        testHelpers.createTestLink(simulationLogic.nodes[0], simulationLogic.nodes[1], 3),
        testHelpers.createTestLink(simulationLogic.nodes[1], simulationLogic.nodes[2])
      ];

      randomBernoulli.mockImplementation(() => () => true);

      simulationLogic.spreadInfection();

      expect(simulationLogic.links[1].value).toBe(3);
    });
  });

  describe('updateInfectedAmounts', () => {
    it('should correctly update infection tracking arrays', () => {
      simulationLogic.infectedAmounts = [{x: 0, y: 0}, {x: 1, y: 2}];
      simulationLogic.totalInfectedAmounts = [{x: 0, y: 1}, {x: 1, y: 2}];
      simulationLogic.tickCount = 1;
      simulationLogic.nodes = testHelpers.createTestNodes([true, true, true, false]);

      simulationLogic.updateInfectedAmounts(1);

      expect(simulationLogic.infectedAmounts).toEqual([
        { x: 0, y: 0 },
        { x: 1, y: 2 },
        { x: 2, y: 1 }
      ]);
      expect(simulationLogic.totalInfectedAmounts).toEqual([
        { x: 0, y: 1 },
        { x: 1, y: 2 },
        { x: 2, y: 3 }
      ]);
      expect(simulationLogic.tickCount).toBe(2);
    });
  });

  describe('resetChartData', () => {
    it('should reset chart data', () => {
      simulationLogic.infectedAmounts = [{ x: 0, y: 0 }, { x: 1, y: 2 }, { x: 2, y: 1 }];
      simulationLogic.totalInfectedAmounts = [{ x: 0, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 3 }];
      simulationLogic.tickCount = 2;

      simulationLogic.resetChartData();

      expect(simulationLogic.infectedAmounts).toEqual([{ x: 0, y: 0 }]);
      expect(simulationLogic.totalInfectedAmounts).toEqual([{ x: 0, y: 0 }]);
      expect(simulationLogic.tickCount).toBe(0);
    });
  });
});
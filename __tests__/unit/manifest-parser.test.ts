import { validateManifest, validateCatalog, compareVersions } from '../../src/lib/manifest-parser';

describe('manifest-parser', () => {
  describe('validateManifest', () => {
    it('should return true for valid manifest', () => {
      const validManifest = {
        metadata: {
          generated_at: '2023-05-01T12:00:00Z',
          dbt_version: '1.5.0'
        },
        nodes: {}
      };
      
      expect(validateManifest(validManifest)).toBe(true);
    });
    
    it('should return false for null or undefined', () => {
      expect(validateManifest(null)).toBe(false);
      expect(validateManifest(undefined)).toBe(false);
    });
    
    it('should return false if metadata is missing', () => {
      const invalidManifest = {
        nodes: {}
      };
      
      expect(validateManifest(invalidManifest)).toBe(false);
    });
    
    it('should return false if required metadata fields are missing', () => {
      const missingDbtVersion = {
        metadata: {
          generated_at: '2023-05-01T12:00:00Z'
        }
      };
      
      const missingGeneratedAt = {
        metadata: {
          dbt_version: '1.5.0'
        }
      };
      
      expect(validateManifest(missingDbtVersion)).toBe(false);
      expect(validateManifest(missingGeneratedAt)).toBe(false);
    });
  });
  
  describe('validateCatalog', () => {
    it('should return true for valid catalog', () => {
      const validCatalog = {
        metadata: {
          generated_at: '2023-05-01T12:00:00Z'
        },
        nodes: {}
      };
      
      expect(validateCatalog(validCatalog)).toBe(true);
    });
    
    it('should return false for null or undefined', () => {
      expect(validateCatalog(null)).toBe(false);
      expect(validateCatalog(undefined)).toBe(false);
    });
    
    it('should return false if metadata is missing', () => {
      const invalidCatalog = {
        nodes: {}
      };
      
      expect(validateCatalog(invalidCatalog)).toBe(false);
    });
    
    it('should return false if required metadata fields are missing', () => {
      const missingGeneratedAt = {
        metadata: {}
      };
      
      expect(validateCatalog(missingGeneratedAt)).toBe(false);
    });
  });
  
  describe('compareVersions', () => {
    it('should return 0 for equal versions', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
    });
    
    it('should return 1 when first version is greater', () => {
      expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
      expect(compareVersions('1.2.0', '1.1.9')).toBe(1);
      expect(compareVersions('1.0.1', '1.0.0')).toBe(1);
    });
    
    it('should return -1 when second version is greater', () => {
      expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
      expect(compareVersions('1.1.9', '1.2.0')).toBe(-1);
      expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
    });
    
    it('should handle different version formats correctly', () => {
      expect(compareVersions('1', '1.0.0')).toBe(0);
      expect(compareVersions('1.0', '1.0.0')).toBe(0);
      expect(compareVersions('1.0.0.0', '1.0.0')).toBe(0);
    });
  });
});
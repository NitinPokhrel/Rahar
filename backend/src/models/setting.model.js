// Settings Model for site configuration - ES Module
import { DataTypes, Model } from 'sequelize';

const Setting = (sequelize) => {
  class Setting extends Model {}

  Setting.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: { msg: 'Setting key must be unique' },
      validate: {
        notEmpty: { msg: 'Setting key is required' }
      }
    },
    value: DataTypes.TEXT,
    type: {
      type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
      defaultValue: 'string'
    },
    description: DataTypes.TEXT,
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Setting',
    tableName: 'settings',
    timestamps: true,
    indexes: [
      { fields: ['key'] },
      { fields: ['isPublic'] }
    ]
  });

  return Setting;
};

export default Setting;
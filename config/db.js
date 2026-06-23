// Using JSON file as local database (no MongoDB dependency needed)
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const DATA_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const collections = {};

function getCollection(name) {
  if (!collections[name]) {
    collections[name] = new Collection(name);
  }
  return collections[name];
}

class Collection {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(DATA_DIR, `${name}.json`);
    this.data = [];
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(raw);
        console.log(`Loaded ${this.data.length} records from ${this.name}`);
      }
    } catch (err) {
      console.error(`Error loading ${this.name}:`, err.message);
      this.data = [];
    }
  }

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    } catch (err) {
      console.error(`Error saving ${this.name}:`, err.message);
    }
  }

  async create(doc) {
    const newDoc = {
      _id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      ...doc,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.push(newDoc);
    this.save();
    return newDoc;
  }

  find(filter = {}) {
    let results = [...this.data];
    for (const key of Object.keys(filter)) {
      if (key === '$or' && Array.isArray(filter.$or)) {
        results = results.filter(item =>
          filter.$or.some(condition =>
            Object.entries(condition).some(([k, v]) => {
              if (v instanceof RegExp) return v.test(String(item[k] || ''));
              return item[k] === v;
            })
          )
        );
      } else if (key !== '$or') {
        const val = filter[key];
        if (val instanceof RegExp) {
          results = results.filter(item => val.test(String(item[key] || '')));
        } else {
          results = results.filter(item => item[key] === val);
        }
      }
    }
    return results;
  }

  findById(id) {
    return this.data.find(doc => doc._id === id) || null;
  }

  findOne(filter = {}) {
    const results = this.find(filter);
    return results.length > 0 ? results[0] : null;
  }

  countDocuments(filter = {}) {
    return this.find(filter).length;
  }

  findByIdAndUpdate(id, update, options = {}) {
    const index = this.data.findIndex(doc => doc._id === id);
    if (index === -1) return null;
    
    const updated = {
      ...this.data[index],
      ...update,
      _id: this.data[index]._id,
      createdAt: this.data[index].createdAt,
      updatedAt: new Date().toISOString(),
    };
    
    this.data[index] = updated;
    this.save();
    return updated;
  }

  findByIdAndDelete(id) {
    const index = this.data.findIndex(doc => doc._id === id);
    if (index === -1) return null;
    const removed = this.data.splice(index, 1)[0];
    this.save();
    return removed;
  }

  findOneAndUpdate(filter, update, options = {}) {
    const results = this.find(filter);
    if (results.length === 0) {
      if (options.upsert) {
        return this.create({ ...filter, ...update });
      }
      return null;
    }
    return this.findByIdAndUpdate(results[0]._id, update, options);
  }

  sort(sortStr) {
    const desc = sortStr.startsWith('-');
    const field = desc ? sortStr.substring(1) : sortStr;
    this.data.sort((a, b) => {
      const aVal = a[field] || '';
      const bVal = b[field] || '';
      if (desc) return aVal < bVal ? 1 : -1;
      return aVal > bVal ? 1 : -1;
    });
    return this;
  }

  skip(n) {
    this.data = this.data.slice(n);
    return this;
  }

  limit(n) {
    this.data = this.data.slice(0, n);
    return this;
  }
}

// Initialize default admin if no users exist
async function initDefaultData() {
  const usersCol = getCollection('users');
  const existing = usersCol.countDocuments();
  
  if (existing === 0) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('mamannkunda', salt);
    
    await usersCol.create({
      name: 'Valentin Lyon',
      email: 'valentinlyon205@gmail.com',
      password: hashedPassword,
      role: 'super_admin',
    });
    console.log('✓ Default admin user created: valentinlyon205@gmail.com / mamannkunda');
  }
}

const connectDB = async () => {
  console.log('✓ Local database initialized (JSON file storage)');
  await initDefaultData();
  return true;
};

module.exports = { connectDB, getCollection };
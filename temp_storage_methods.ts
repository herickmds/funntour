// Métodos para gerenciamento de países
async getAllCountries(): Promise<Country[]> {
  return Array.from(this.countries.values());
}

async getCountry(id: number): Promise<Country | undefined> {
  return this.countries.get(id);
}

async getCountryByName(name: string): Promise<Country | undefined> {
  return Array.from(this.countries.values()).find(
    (country) => country.name.toLowerCase() === name.toLowerCase()
  );
}

async getCountryByCode(code: string): Promise<Country | undefined> {
  return Array.from(this.countries.values()).find(
    (country) => country.code.toLowerCase() === code.toLowerCase()
  );
}

async createCountry(insertCountry: InsertCountry): Promise<Country> {
  // Check for duplicate name
  const existingByName = await this.getCountryByName(insertCountry.name);
  if (existingByName) {
    throw new Error(`País com nome "${insertCountry.name}" já existe`);
  }

  // Check for duplicate code
  const existingByCode = await this.getCountryByCode(insertCountry.code);
  if (existingByCode) {
    throw new Error(`País com sigla "${insertCountry.code}" já existe`);
  }

  const id = this.countryIdCounter++;
  const now = new Date().toISOString();
  
  const country: Country = {
    ...insertCountry,
    id,
    createdAt: now,
    updatedAt: now
  };
  
  this.countries.set(id, country);
  return country;
}

async updateCountry(id: number, countryData: Partial<InsertCountry>): Promise<Country | undefined> {
  const existingCountry = this.countries.get(id);
  if (!existingCountry) return undefined;

  // Check for duplicate name if name is being changed
  if (countryData.name && countryData.name !== existingCountry.name) {
    const nameExists = Array.from(this.countries.values()).find(
      (country) => country.name.toLowerCase() === countryData.name!.toLowerCase() && country.id !== id
    );
    
    if (nameExists) {
      throw new Error(`País com nome "${countryData.name}" já existe`);
    }
  }

  // Check for duplicate code if code is being changed
  if (countryData.code && countryData.code !== existingCountry.code) {
    const codeExists = Array.from(this.countries.values()).find(
      (country) => country.code.toLowerCase() === countryData.code!.toLowerCase() && country.id !== id
    );
    
    if (codeExists) {
      throw new Error(`País com sigla "${countryData.code}" já existe`);
    }
  }

  const updatedCountry: Country = {
    ...existingCountry,
    ...countryData,
    id,
    updatedAt: new Date().toISOString()
  };
  
  this.countries.set(id, updatedCountry);
  return updatedCountry;
}

async deleteCountry(id: number): Promise<boolean> {
  // Check if any states are associated with this country
  const statesUsingCountry = Array.from(this.states.values())
    .find(state => state.countryId === id);
  
  if (statesUsingCountry) {
    throw new Error(`Não é possível excluir o país pois existem estados vinculados a ele`);
  }
  
  return this.countries.delete(id);
}

// State operations
async getAllStates(): Promise<State[]> {
  return Array.from(this.states.values());
}

async getState(id: number): Promise<State | undefined> {
  return this.states.get(id);
}

async getStateByNameAndCountry(name: string, countryId: number): Promise<State | undefined> {
  return Array.from(this.states.values()).find(
    (state) => state.name.toLowerCase() === name.toLowerCase() && state.countryId === countryId
  );
}

async getStateByCodeAndCountry(code: string, countryId: number): Promise<State | undefined> {
  return Array.from(this.states.values()).find(
    (state) => state.code.toLowerCase() === code.toLowerCase() && state.countryId === countryId
  );
}

async getStatesByCountry(countryId: number): Promise<State[]> {
  return Array.from(this.states.values())
    .filter(state => state.countryId === countryId);
}

async createState(insertState: InsertState): Promise<State> {
  // Verify if the country exists
  const country = await this.getCountry(insertState.countryId);
  if (!country) {
    throw new Error(`País com ID ${insertState.countryId} não encontrado`);
  }

  // Check for duplicate name within the same country
  const existingByName = await this.getStateByNameAndCountry(insertState.name, insertState.countryId);
  if (existingByName) {
    throw new Error(`Estado com nome "${insertState.name}" já existe para este país`);
  }

  // Check for duplicate code within the same country
  const existingByCode = await this.getStateByCodeAndCountry(insertState.code, insertState.countryId);
  if (existingByCode) {
    throw new Error(`Estado com sigla "${insertState.code}" já existe para este país`);
  }

  const id = this.stateIdCounter++;
  const now = new Date().toISOString();
  
  const state: State = {
    ...insertState,
    id,
    createdAt: now,
    updatedAt: now
  };
  
  this.states.set(id, state);
  return state;
}

async updateState(id: number, stateData: Partial<InsertState>): Promise<State | undefined> {
  const existingState = this.states.get(id);
  if (!existingState) return undefined;

  // Check countryId if it's being updated
  if (stateData.countryId && stateData.countryId !== existingState.countryId) {
    const country = await this.getCountry(stateData.countryId);
    if (!country) {
      throw new Error(`País com ID ${stateData.countryId} não encontrado`);
    }
  }

  const countryId = stateData.countryId || existingState.countryId;

  // Check for duplicate name if name is being changed
  if (stateData.name && stateData.name !== existingState.name) {
    const nameExists = await this.getStateByNameAndCountry(stateData.name, countryId);
    if (nameExists && nameExists.id !== id) {
      throw new Error(`Estado com nome "${stateData.name}" já existe para este país`);
    }
  }

  // Check for duplicate code if code is being changed
  if (stateData.code && stateData.code !== existingState.code) {
    const codeExists = await this.getStateByCodeAndCountry(stateData.code, countryId);
    if (codeExists && codeExists.id !== id) {
      throw new Error(`Estado com sigla "${stateData.code}" já existe para este país`);
    }
  }

  const updatedState: State = {
    ...existingState,
    ...stateData,
    id,
    updatedAt: new Date().toISOString()
  };
  
  this.states.set(id, updatedState);
  return updatedState;
}

async deleteState(id: number): Promise<boolean> {
  // Check if any cities are associated with this state
  const citiesUsingState = Array.from(this.cities.values())
    .find(city => city.stateId === id);
  
  if (citiesUsingState) {
    throw new Error(`Não é possível excluir o estado pois existem cidades vinculadas a ele`);
  }
  
  return this.states.delete(id);
}

// City operations
async getAllCities(): Promise<City[]> {
  return Array.from(this.cities.values());
}

async getCity(id: number): Promise<City | undefined> {
  return this.cities.get(id);
}

async getCityByNameAndState(name: string, stateId: number): Promise<City | undefined> {
  return Array.from(this.cities.values()).find(
    (city) => city.name.toLowerCase() === name.toLowerCase() && city.stateId === stateId
  );
}

async getCitiesByState(stateId: number): Promise<City[]> {
  return Array.from(this.cities.values())
    .filter(city => city.stateId === stateId);
}

async createCity(insertCity: InsertCity): Promise<City> {
  // Verify if the state exists
  const state = await this.getState(insertCity.stateId);
  if (!state) {
    throw new Error(`Estado com ID ${insertCity.stateId} não encontrado`);
  }

  // Check for duplicate name within the same state
  const existingByName = await this.getCityByNameAndState(insertCity.name, insertCity.stateId);
  if (existingByName) {
    throw new Error(`Cidade com nome "${insertCity.name}" já existe para este estado`);
  }

  const id = this.cityIdCounter++;
  const now = new Date().toISOString();
  
  const city: City = {
    ...insertCity,
    id,
    createdAt: now,
    updatedAt: now
  };
  
  this.cities.set(id, city);
  return city;
}

async updateCity(id: number, cityData: Partial<InsertCity>): Promise<City | undefined> {
  const existingCity = this.cities.get(id);
  if (!existingCity) return undefined;

  // Check stateId if it's being updated
  if (cityData.stateId && cityData.stateId !== existingCity.stateId) {
    const state = await this.getState(cityData.stateId);
    if (!state) {
      throw new Error(`Estado com ID ${cityData.stateId} não encontrado`);
    }
  }

  const stateId = cityData.stateId || existingCity.stateId;

  // Check for duplicate name if name is being changed
  if (cityData.name && cityData.name !== existingCity.name) {
    const nameExists = await this.getCityByNameAndState(cityData.name, stateId);
    if (nameExists && nameExists.id !== id) {
      throw new Error(`Cidade com nome "${cityData.name}" já existe para este estado`);
    }
  }

  const updatedCity: City = {
    ...existingCity,
    ...cityData,
    id,
    updatedAt: new Date().toISOString()
  };
  
  this.cities.set(id, updatedCity);
  return updatedCity;
}

async deleteCity(id: number): Promise<boolean> {
  return this.cities.delete(id);
}
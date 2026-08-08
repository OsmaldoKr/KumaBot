import mongoose from 'mongoose'

const { Schema } = mongoose

const defaultOptions = {
  serverSelectionTimeoutMS: 10_000,
}

const dataSchema = new Schema(
  {
    data: {
      type: Schema.Types.Mixed,
      default: {},
      required: true,
    },
  },
  {
    versionKey: false,
  },
)

const listSchema = new Schema(
  {
    data: {
      type: [
        {
          name: {
            type: String,
            required: true,
          },
        },
      ],
      default: [],
    },
  },
  {
    versionKey: false,
  },
)

const collectionSchema = new Schema(
  {
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    versionKey: false,
  },
)

function validateCollectionName(name) {
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(name)) {
    throw new Error(`Nombre de colección inválido: ${name}`)
  }

  return name
}

/**
 * Adaptador MongoDB de una sola colección.
 * Recomendado para KumaBot.
 */
export class mongoDB {
  constructor(url, options = {}) {
    if (!url) {
      throw new Error('Debes proporcionar una URL de conexión a MongoDB.')
    }

    this.url = url
    this.options = {
      ...defaultOptions,
      ...options,
    }

    this.data = {}
    this._data = null
    this._model = null

    this.connection = mongoose.createConnection(
      this.url,
      this.options,
    )

    this.db = this.connection.asPromise()
  }

  async read() {
    await this.db

    this._model =
      this.connection.models.KumaBotData ||
      this.connection.model(
        'KumaBotData',
        dataSchema,
        'kumabot_data',
      )

    this._data = await this._model.findOne().lean()

    if (!this._data) {
      const document = await this._model.create({
        data: {},
      })

      this._data = document.toObject()
    }

    this.data = this._data.data || {}

    return this.data
  }

  async write(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Los datos que se guardarán deben ser un objeto.')
    }

    await this.db

    if (!this._model) {
      await this.read()
    }

    const filter = this._data?._id ? { _id: this._data._id } : {}

    const document = await this._model.findOneAndUpdate(
      filter,
      {
        $set: {
          data,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    ).lean()

    this._data = document
    this.data = data

    return document
  }

  async close() {
    await this.connection.close()
  }
}

/**
 * Adaptador MongoDB con una colección independiente por categoría.
 *
 * Úsalo solamente si tu base de datos anterior ya trabajaba con este formato.
 * Para instalaciones nuevas, usa mongoDB.
 */
export class mongoDBV2 {
  constructor(url, options = {}) {
    if (!url) {
      throw new Error('Debes proporcionar una URL de conexión a MongoDB.')
    }

    this.url = url
    this.options = {
      ...defaultOptions,
      ...options,
    }

    this.models = []
    this.data = {}
    this.lists = null
    this.list = null

    this.connection = mongoose.createConnection(
      this.url,
      this.options,
    )

    this.db = this.connection.asPromise()
  }

  getCollectionModel(name) {
    const safeName = validateCollectionName(name)
    const modelName = `KumaBot_${safeName}`

    return (
      this.connection.models[modelName] ||
      this.connection.model(
        modelName,
        collectionSchema,
        safeName,
      )
    )
  }

  async read() {
    await this.db

    this.list =
      this.connection.models.KumaBotLists ||
      this.connection.model(
        'KumaBotLists',
        listSchema,
        'kumabot_lists',
      )

    this.lists = await this.list.findOne()

    if (!this.lists) {
      this.lists = await this.list.create({
        data: [],
      })
    }

    this.models = []
    this.data = {}

    const invalidCollections = []

    for (const item of this.lists.data || []) {
      const name = item?.name

      try {
        validateCollectionName(name)

        const model = this.getCollectionModel(name)
        const documents = await model.find().lean()

        this.models.push({
          name,
          model,
        })

        this.data[name] = Object.fromEntries(
          documents
            .map((document) => document.data)
            .filter(
              (entry) =>
                Array.isArray(entry) &&
                entry.length === 2,
            ),
        )
      } catch (error) {
        console.error(
          `No se pudo cargar la colección "${name}":`,
          error.message,
        )

        invalidCollections.push(name)
      }
    }

    if (invalidCollections.length) {
      this.lists.data = this.lists.data.filter(
        (item) => !invalidCollections.includes(item.name),
      )

      await this.lists.save()
    }

    return this.data
  }

  async write(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Los datos que se guardarán deben ser un objeto.')
    }

    await this.db

    if (!this.lists || !this.list) {
      await this.read()
    }

    const collectionNames = Object.keys(data)
    const newList = []

    for (const name of collectionNames) {
      validateCollectionName(name)

      const values = data[name]

      if (!values || typeof values !== 'object') {
        continue
      }

      const model = this.getCollectionModel(name)
      const entries = Object.entries(values).map(([key, value]) => ({
        data: [key, value],
      }))

      await model.deleteMany({})

      if (entries.length) {
        await model.insertMany(entries)
      }

      const index = this.models.findIndex(
        (item) => item.name === name,
      )

      const modelData = {
        name,
        model,
      }

      if (index >= 0) {
        this.models[index] = modelData
      } else {
        this.models.push(modelData)
      }

      newList.push({ name })
    }

    this.lists.data = newList
    await this.lists.save()

    this.data = data

    return true
  }

  async close() {
    await this.connection.close()
  }
}

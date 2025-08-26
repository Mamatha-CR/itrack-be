/**
 * @swagger
 * tags:
 *   - name: Auth
 *   - name: Settings
 *   - name: Masters
 *   - name: Administration
 *   - name: Jobs
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email & password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: JWT + user info }
 */

/* ========================= Settings ========================= */

/**
 * @swagger
 * /settings/countries:
 *   get:
 *     tags: [Settings]
 *     summary: List countries
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: searchParam
 *         schema: { type: string }
 *         description: Fuzzy search across country_name and country_code
 *       - in: query
 *         name: status
 *         schema: { type: boolean }
 *         description: Filter by country_status (true/false)
 *       - in: query
 *         name: country_id
 *         schema: { type: integer }
 *       - in: query
 *         name: country_code
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [country_id, country_name, country_code, country_status] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [ASC, DESC], default: ASC }
 *     responses:
 *       200: { description: OK }
 *   post:
 *     tags: [Settings]
 *     summary: Create country
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [country_id, country_name, country_code, country_status]
 *             properties:
 *               country_id: { type: integer, example: 91 }
 *               country_name: { type: string, example: India }
 *               country_code: { type: string, example: IN }
 *               country_status: { type: boolean, example: true }
 *     responses:
 *       201: { description: Created }
 *       409: { description: Conflict (duplicate) }
 * /settings/countries/{id}:
 *   get:
 *     tags: [Settings]
 *     summary: Get country by ID
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 *   put:
 *     tags: [Settings]
 *     summary: Update country
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               country_name: { type: string, example: India }
 *               country_code: { type: string, example: IN }
 *               country_status: { type: boolean, example: true }
 *     responses:
 *       200: { description: OK }
 *       409: { description: Conflict (duplicate) }
 *       404: { description: Not found }
 *   delete:
 *     tags: [Settings]
 *     summary: Delete country
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Deleted }
 *       404: { description: Not found }
 */

/**
 * @swagger
 * /settings/states:
 *   get:
 *     tags: [Settings]
 *     summary: List states
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: searchParam
 *         schema: { type: string }
 *         description: Fuzzy search across state_name
 *       - in: query
 *         name: status
 *         schema: { type: boolean }
 *         description: Filter by state_status (true/false)
 *       - in: query
 *         name: country_id
 *         schema: { type: integer }
 *       - in: query
 *         name: state_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [state_name, state_status, state_id] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [ASC, DESC], default: ASC }
 *     responses:
 *       200: { description: OK }
 *   post:
 *     tags: [Settings]
 *     summary: Create state
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [country_id, state_name, state_status]
 *             properties:
 *               country_id: { type: integer, example: 91 }
 *               state_name: { type: string, example: Andhra Pradesh }
 *               state_status: { type: boolean, example: true }
 *     responses:
 *       201: { description: Created }
 *       409: { description: Conflict (duplicate) }
 * /settings/states/{id}:
 *   get:
 *     tags: [Settings]
 *     summary: Get state by ID
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 *   put:
 *     tags: [Settings]
 *     summary: Update state
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               country_id: { type: integer, example: 91 }
 *               state_name: { type: string, example: Andhra Pradesh }
 *               state_status: { type: boolean, example: true }
 *     responses:
 *       200: { description: OK }
 *       409: { description: Conflict (duplicate) }
 *       404: { description: Not found }
 *   delete:
 *     tags: [Settings]
 *     summary: Delete state
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Deleted }
 *       404: { description: Not found }
 */

/**
 * @swagger
 * /settings/districts:
 *   get:
 *     tags: [Settings]
 *     summary: List districts
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: searchParam
 *         schema: { type: string }
 *         description: Fuzzy search across district_name
 *       - in: query
 *         name: status
 *         schema: { type: boolean }
 *         description: Filter by district_status (true/false)
 *       - in: query
 *         name: country_id
 *         schema: { type: integer }
 *       - in: query
 *         name: state_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: district_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [district_name, district_status, district_id] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [ASC, DESC], default: ASC }
 *     responses:
 *       200: { description: OK }
 *   post:
 *     tags: [Settings]
 *     summary: Create district
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [country_id, state_id, district_name, district_status]
 *             properties:
 *               country_id: { type: integer, example: 91 }
 *               state_id: { type: string, format: uuid, example: "00000000-0000-0000-0000-000000000000" }
 *               district_name: { type: string, example: Chittoor }
 *               district_status: { type: boolean, example: true }
 *     responses:
 *       201: { description: Created }
 *       409: { description: Conflict (duplicate) }
 * /settings/districts/{id}:
 *   get:
 *     tags: [Settings]
 *     summary: Get district by ID
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 *   put:
 *     tags: [Settings]
 *     summary: Update district
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               country_id: { type: integer, example: 91 }
 *               state_id: { type: string, format: uuid, example: "00000000-0000-0000-0000-000000000000" }
 *               district_name: { type: string, example: Chittoor }
 *               district_status: { type: boolean, example: true }
 *     responses:
 *       200: { description: OK }
 *       409: { description: Conflict (duplicate) }
 *       404: { description: Not found }
 *   delete:
 *     tags: [Settings]
 *     summary: Delete district
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Deleted }
 *       404: { description: Not found }
 */

/**
 * @swagger
 * /settings/pincodes:
 *   get:
 *     tags: [Settings]
 *     summary: List pincodes
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: searchParam
 *         schema: { type: string }
 *         description: Fuzzy search across pincode (string match)
 *       - in: query
 *         name: country_id
 *         schema: { type: integer }
 *       - in: query
 *         name: state_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: district_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: pincode
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [pincode, id] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [ASC, DESC], default: ASC }
 *     responses:
 *       200: { description: OK }
 *   post:
 *     tags: [Settings]
 *     summary: Create pincode
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [country_id, state_id, district_id, pincode]
 *             properties:
 *               country_id: { type: integer, example: 91 }
 *               state_id: { type: string, format: uuid, example: "00000000-0000-0000-0000-000000000000" }
 *               district_id: { type: string, format: uuid, example: "00000000-0000-0000-0000-000000000000" }
 *               pincode: { type: string, example: "517415" }
 *               lat: { type: number, format: float, example: 13.0907 }
 *               lng: { type: number, format: float, example: 78.6084 }
 *     responses:
 *       201: { description: Created }
 *       409: { description: Conflict (duplicate) }
 * /settings/pincodes/{id}:
 *   get:
 *     tags: [Settings]
 *     summary: Get pincode by ID
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 *   put:
 *     tags: [Settings]
 *     summary: Update pincode
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               country_id: { type: integer, example: 91 }
 *               state_id: { type: string, format: uuid, example: "00000000-0000-0000-0000-000000000000" }
 *               district_id: { type: string, format: uuid, example: "00000000-0000-0000-0000-000000000000" }
 *               pincode: { type: string, example: "517415" }
 *               lat: { type: number, format: float, example: 13.0907 }
 *               lng: { type: number, format: float, example: 78.6084 }
 *     responses:
 *       200: { description: OK }
 *       409: { description: Conflict (duplicate) }
 *       404: { description: Not found }
 *   delete:
 *     tags: [Settings]
 *     summary: Delete pincode
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Deleted }
 *       404: { description: Not found }
 */

/* ========================= MASTERS ========================= */

/**
 * @swagger
 * /masters/nature-of-work:
 *   get:
 *     tags: [Masters]
 *     summary: List nature of work
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: searchParam
 *         schema: { type: string }
 *         description: Fuzzy search across now_name
 *       - in: query
 *         name: status
 *         schema: { type: boolean }
 *         description: Filter by now_status (true/false)
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [now_name, now_status, now_id] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [ASC, DESC], default: ASC }
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Masters]
 *     summary: Create nature of work
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [now_name, now_status]
 *             properties:
 *               now_id: { type: string, format: uuid }
 *               now_name: { type: string, example: Phone Call }
 *               now_status: { type: boolean, example: true }
 *     responses:
 *       201: { description: Created }
 *       409: { description: Conflict (duplicate) }
 * /masters/nature-of-work/{id}:
 *   get:
 *     tags: [Masters]
 *     summary: Get nature of work by ID
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     responses: { 200: { description: OK }, 404: { description: Not found } }
 *   put:
 *     tags: [Masters]
 *     summary: Update nature of work
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               now_name: { type: string, example: Field Work }
 *               now_status: { type: boolean, example: true }
 *     responses:
 *       200: { description: OK }
 *       409: { description: Conflict (duplicate) }
 *       404: { description: Not found }
 *   delete:
 *     tags: [Masters]
 *     summary: Delete nature of work
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     responses: { 200: { description: Deleted }, 404: { description: Not found } }
 */

/**
 * @swagger
 * /masters/job-statuses:
 *   get:
 *     tags: [Masters]
 *     summary: List job statuses
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: searchParam
 *         schema: { type: string }
 *         description: Fuzzy search across job_status_title
 *       - in: query
 *         name: status
 *         schema: { type: boolean }
 *         description: Filter by status (true/false)
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [job_status_title, status, job_status_id] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [ASC, DESC], default: ASC }
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Masters]
 *     summary: Create job status
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [job_status_title, status]
 *             properties:
 *               job_status_id: { type: string, format: uuid }
 *               job_status_title: { type: string, example: not_started }
 *               status: { type: boolean, example: true }
 *               job_status_color_code: { type: string, example: "#808080" }
 *     responses:
 *       201: { description: Created }
 *       409: { description: Conflict (duplicate) }
 * /masters/job-statuses/{id}:
 *   get:
 *     tags: [Masters]
 *     summary: Get job status by ID
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     responses: { 200: { description: OK }, 404: { description: Not found } }
 *   put:
 *     tags: [Masters]
 *     summary: Update job status
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               job_status_title: { type: string, example: completed }
 *               status: { type: boolean, example: true }
 *               job_status_color_code: { type: string, example: "#22c55e" }
 *     responses:
 *       200: { description: OK }
 *       409: { description: Conflict (duplicate) }
 *       404: { description: Not found }
 *   delete:
 *     tags: [Masters]
 *     summary: Delete job status
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     responses: { 200: { description: Deleted }, 404: { description: Not found } }
 */

/**
 * @swagger
 * /masters/subscription-types:
 *   get:
 *     tags: [Masters]
 *     summary: List subscription types
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: searchParam
 *         schema: { type: string }
 *         description: Fuzzy search across subscription_title
 *       - in: query
 *         name: status
 *         schema: { type: boolean }
 *         description: Filter by subscription_status (true/false)
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [subscription_title, subscription_status, subscription_id] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [ASC, DESC], default: ASC }
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Masters]
 *     summary: Create subscription type
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subscription_title, subscription_status]
 *             properties:
 *               subscription_id: { type: string, format: uuid }
 *               subscription_title: { type: string, example: Free }
 *               subscription_status: { type: boolean, example: true }
 *     responses:
 *       201: { description: Created }
 *       409: { description: Conflict (duplicate) }
 * /masters/subscription-types/{id}:
 *   get:
 *     tags: [Masters]
 *     summary: Get subscription type by ID
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     responses: { 200: { description: OK }, 404: { description: Not found } }
 *   put:
 *     tags: [Masters]
 *     summary: Update subscription type
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subscription_title: { type: string, example: Paid }
 *               subscription_status: { type: boolean, example: true }
 *     responses:
 *       200: { description: OK }
 *       409: { description: Conflict (duplicate) }
 *       404: { description: Not found }
 *   delete:
 *     tags: [Masters]
 *     summary: Delete subscription type
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     responses: { 200: { description: Deleted }, 404: { description: Not found } }
 */

/**
 * @swagger
 * /masters/business-types:
 *   get:
 *     tags: [Masters]
 *     summary: List business types
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: searchParam
 *         schema: { type: string }
 *         description: Fuzzy search across business_typeName
 *       - in: query
 *         name: status
 *         schema: { type: boolean }
 *         description: Filter by status (true/false)
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [business_typeName, status, business_typeId] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [ASC, DESC], default: ASC }
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Masters]
 *     summary: Create business type
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [business_typeName, status]
 *             properties:
 *               business_typeId: { type: string, format: uuid }
 *               business_typeName: { type: string, example: Manufacturing }
 *               status: { type: boolean, example: true }
 *     responses:
 *       201: { description: Created }
 *       409: { description: Conflict (duplicate) }
 * /masters/business-types/{id}:
 *   get:
 *     tags: [Masters]
 *     summary: Get business type by ID
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     responses: { 200: { description: OK }, 404: { description: Not found } }
 *   put:
 *     tags: [Masters]
 *     summary: Update business type
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               business_typeName: { type: string, example: Retail }
 *               status: { type: boolean, example: true }
 *     responses:
 *       200: { description: OK }
 *       409: { description: Conflict (duplicate) }
 *       404: { description: Not found }
 *   delete:
 *     tags: [Masters]
 *     summary: Delete business type
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     responses: { 200: { description: Deleted }, 404: { description: Not found } }
 */

/**
 * @swagger
 * /masters/work-types:
 *   get:
 *     tags: [Masters]
 *     summary: List work types
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: searchParam
 *         schema: { type: string }
 *         description: Fuzzy search across worktype_name and worktype_description
 *       - in: query
 *         name: status
 *         schema: { type: boolean }
 *         description: Filter by status (true/false)
 *       - in: query
 *         name: company_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [worktype_name, status, worktype_id] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [ASC, DESC], default: ASC }
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Masters]
 *     summary: Create work type
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [worktype_name, status]
 *             properties:
 *               company_id: { type: string, format: uuid, description: Required only for super_admin }
 *               worktype_id: { type: string, format: uuid }
 *               worktype_name: { type: string, example: Preventive Maintenance }
 *               worktype_description: { type: string, example: Planned routine checks }
 *               status: { type: boolean, example: true }
 *     responses:
 *       201: { description: Created }
 *       409: { description: Conflict (duplicate) }
 * /masters/work-types/{id}:
 *   get:
 *     tags: [Masters]
 *     summary: Get work type by ID
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     responses: { 200: { description: OK }, 404: { description: Not found } }
 *   put:
 *     tags: [Masters]
 *     summary: Update work type
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               company_id: { type: string, format: uuid }
 *               worktype_name: { type: string, example: Corrective Repair }
 *               worktype_description: { type: string, example: On-demand repair after a failure }
 *               status: { type: boolean, example: true }
 *     responses:
 *       200: { description: OK }
 *       409: { description: Conflict (duplicate) }
 *       404: { description: Not found }
 *   delete:
 *     tags: [Masters]
 *     summary: Delete work type
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     responses: { 200: { description: Deleted }, 404: { description: Not found } }
 */

/**
 * @swagger
 * /masters/job-types:
 *   get:
 *     tags: [Masters]
 *     summary: List job types
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: searchParam
 *         schema: { type: string }
 *         description: Fuzzy search across jobtype_name and description
 *       - in: query
 *         name: status
 *         schema: { type: boolean }
 *         description: Filter by status (true/false)
 *       - in: query
 *         name: company_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: worktype_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [jobtype_name, estimated_duration, status, jobtype_id] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [ASC, DESC], default: ASC }
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Masters]
 *     summary: Create job type
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [worktype_id, jobtype_name, estimated_duration, status]
 *             properties:
 *               company_id: { type: string, format: uuid, description: Required only for super_admin }
 *               worktype_id: { type: string, format: uuid, example: "00000000-0000-0000-0000-000000000000" }
 *               jobtype_id: { type: string, format: uuid }
 *               jobtype_name: { type: string, example: AC Gas Refill }
 *               description: { type: string, example: Includes leak test and refill }
 *               estimated_duration: { type: integer, example: 120, description: Minutes }
 *               status: { type: boolean, example: true }
 *     responses:
 *       201: { description: Created }
 *       409: { description: Conflict (duplicate) }
 * /masters/job-types/{id}:
 *   get:
 *     tags: [Masters]
 *     summary: Get job type by ID
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     responses: { 200: { description: OK }, 404: { description: Not found } }
 *   put:
 *     tags: [Masters]
 *     summary: Update job type
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               company_id: { type: string, format: uuid }
 *               worktype_id: { type: string, format: uuid }
 *               jobtype_name: { type: string, example: Compressor Replacement }
 *               description: { type: string, example: Replace compressor with warranty }
 *               estimated_duration: { type: integer, example: 240 }
 *               status: { type: boolean, example: true }
 *     responses:
 *       200: { description: OK }
 *       409: { description: Conflict (duplicate) }
 *       404: { description: Not found }
 *   delete:
 *     tags: [Masters]
 *     summary: Delete job type
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     responses: { 200: { description: Deleted }, 404: { description: Not found } }
 */

/**
 * @swagger
 * /masters/regions:
 *   get:
 *     tags: [Masters]
 *     summary: List regions
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: searchParam
 *         schema: { type: string }
 *         description: Fuzzy search across region_name
 *       - in: query
 *         name: status
 *         schema: { type: boolean }
 *         description: Filter by status (true/false)
 *       - in: query
 *         name: company_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: country_id
 *         schema: { type: integer }
 *       - in: query
 *         name: state_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: district_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [region_name, status, region_id] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [ASC, DESC], default: ASC }
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Masters]
 *     summary: Create region
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [region_name, country_id, state_id, district_id, status]
 *             properties:
 *               company_id: { type: string, format: uuid, description: Required only for super_admin }
 *               region_id: { type: string, format: uuid }
 *               region_name: { type: string, example: South Zone }
 *               country_id: { type: integer, example: 91 }
 *               state_id: { type: string, format: uuid, example: "00000000-0000-0000-0000-000000000000" }
 *               district_id: { type: string, format: uuid, example: "00000000-0000-0000-0000-000000000000" }
 *               pincodes:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["517415","500081"]
 *               status: { type: boolean, example: true }
 *     responses:
 *       201: { description: Created }
 *       409: { description: Conflict (duplicate) }
 * /masters/regions/{id}:
 *   get:
 *     tags: [Masters]
 *     summary: Get region by ID
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     responses: { 200: { description: OK }, 404: { description: Not found } }
 *   put:
 *     tags: [Masters]
 *     summary: Update region
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               company_id: { type: string, format: uuid }
 *               region_name: { type: string, example: Central Zone }
 *               country_id: { type: integer, example: 91 }
 *               state_id: { type: string, format: uuid }
 *               district_id: { type: string, format: uuid }
 *               pincodes:
 *                 type: array
 *                 items: { type: string }
 *               status: { type: boolean, example: true }
 *     responses:
 *       200: { description: OK }
 *       409: { description: Conflict (duplicate) }
 *       404: { description: Not found }
 *   delete:
 *     tags: [Masters]
 *     summary: Delete region
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     responses: { 200: { description: Deleted }, 404: { description: Not found } }
 */

/**
 * @swagger
 * /masters/shifts:
 *   get:
 *     tags: [Masters]
 *     summary: List shifts
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: searchParam
 *         schema: { type: string }
 *         description: Fuzzy search across shift_name and description
 *       - in: query
 *         name: status
 *         schema: { type: boolean }
 *         description: Filter by status (true/false)
 *       - in: query
 *         name: company_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [shift_name, shift_startTime, shift_endTime, status, shift_id] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [ASC, DESC], default: ASC }
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Masters]
 *     summary: Create shift
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shift_name, shift_startTime, shift_endTime, status]
 *             properties:
 *               company_id: { type: string, format: uuid, description: Required only for super_admin }
 *               shift_id: { type: string, format: uuid }
 *               shift_name: { type: string, example: Morning Shift }
 *               shift_startTime: { type: string, example: "09:00" }
 *               shift_endTime: { type: string, example: "17:30" }
 *               description: { type: string, example: Day operations }
 *               status: { type: boolean, example: true }
 *     responses:
 *       201: { description: Created }
 *       409: { description: Conflict (duplicate) }
 * /masters/shifts/{id}:
 *   get:
 *     tags: [Masters]
 *     summary: Get shift by ID
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     responses: { 200: { description: OK }, 404: { description: Not found } }
 *   put:
 *     tags: [Masters]
 *     summary: Update shift
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               company_id: { type: string, format: uuid }
 *               shift_name: { type: string, example: Evening Shift }
 *               shift_startTime: { type: string, example: "13:00" }
 *               shift_endTime: { type: string, example: "21:00" }
 *               description: { type: string, example: Second half ops }
 *               status: { type: boolean, example: true }
 *     responses:
 *       200: { description: OK }
 *       409: { description: Conflict (duplicate) }
 *       404: { description: Not found }
 *   delete:
 *     tags: [Masters]
 *     summary: Delete shift
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     responses: { 200: { description: Deleted }, 404: { description: Not found } }
 */

/**
 * @swagger
 * /masters/roles:
 *   get:
 *     tags: [Masters]
 *     summary: List roles
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: searchParam
 *         schema: { type: string }
 *         description: Fuzzy search across role_name
 *       - in: query
 *         name: status
 *         schema: { type: boolean }
 *         description: Filter by status (true/false)
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [role_name, status, role_id] }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [ASC, DESC], default: ASC }
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Masters]
 *     summary: Create role
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role_name, status]
 *             properties:
 *               role_id: { type: string, format: uuid }
 *               role_name: { type: string, example: supervisor }
 *               status: { type: boolean, example: true }
 *     responses:
 *       201: { description: Created }
 *       409: { description: Conflict (duplicate) }
 * /masters/roles/{id}:
 *   get:
 *     tags: [Masters]
 *     summary: Get role by ID
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     responses: { 200: { description: OK }, 404: { description: Not found } }
 *   put:
 *     tags: [Masters]
 *     summary: Update role
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role_name: { type: string, example: technician }
 *               status: { type: boolean, example: true }
 *     responses:
 *       200: { description: OK }
 *       409: { description: Conflict (duplicate) }
 *       404: { description: Not found }
 *   delete:
 *     tags: [Masters]
 *     summary: Delete role
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     responses: { 200: { description: Deleted }, 404: { description: Not found } }
 */

/**
 * @swagger
 * /masters/screens:
 *   get:
 *     tags: [Masters]
 *     summary: List screens
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: query
 *         name: searchParam
 *         schema: { type: string }
 *         description: Fuzzy search across screen_name (if applicable)
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, example: screen_name }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [ASC, DESC], default: ASC }
 *     responses: { 200: { description: OK } }
 * /masters/roles/{role_id}/screens/{screen_id}:
 *   put:
 *     tags: [Masters]
 *     summary: Upsert role ↔ screen permissions
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - in: path
 *         name: role_id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: screen_id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               can_view: { type: boolean, example: true }
 *               can_add: { type: boolean, example: false }
 *               can_edit: { type: boolean, example: false }
 *               can_delete: { type: boolean, example: false }
 *     responses:
 *       200: { description: OK }
 */

/* ========================= ADMINISTRATION ========================= */
/**
 * @swagger
 * /admin/companies:
 *   get:
 *     tags: [Administration]
 *     summary: List companies
 *     description: |
 *       Supports pagination, sorting, fuzzy search, and exact filters.
 *       **Query examples:**
 *       - `?page=1&limit=10`
 *       - `?searchParam=acme`
 *       - `?sortBy=name&order=ASC`
 *       - `?country_id=91&state_id=<uuid>&subscription_id=<uuid>&status=true`
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1 }, description: Page number }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1 }, description: Page size }
 *       - { in: query, name: searchParam, schema: { type: string }, description: Fuzzy search on name,email,phone,gst,city }
 *       - { in: query, name: sortBy, schema: { type: string }, description: Sort field (defaults to PK if invalid) }
 *       - { in: query, name: order, schema: { type: string, enum: [ASC, DESC] }, description: Sort order }
 *       - { in: query, name: country_id, schema: { type: integer }, description: Exact filter }
 *       - { in: query, name: state_id, schema: { type: string, format: uuid }, description: Exact filter }
 *       - { in: query, name: subscription_id, schema: { type: string, format: uuid }, description: Exact filter }
 *       - { in: query, name: status, schema: { type: boolean }, description: Exact filter }
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Administration]
 *     summary: Create company
 *     description: Super admin only.
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses: { 201: { description: Created } }
 * /admin/companies/{id}:
 *   get:
 *     tags: [Administration]
 *     summary: Get company by ID
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     responses: { 200: { description: OK } }
 *   put:
 *     tags: [Administration]
 *     summary: Update company
 *     description: Super admin only.
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses: { 200: { description: OK } }
 *   delete:
 *     tags: [Administration]
 *     summary: Delete company
 *     description: Super admin only.
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     responses: { 200: { description: Deleted } }
 */

/**
 * @swagger
 * /admin/vendors:
 *   get:
 *     tags: [Administration]
 *     summary: List vendors
 *     description: |
 *       Org-scoped. Supports pagination, sorting, fuzzy search, and exact filters.
 *       **Query examples:** `?searchParam=john&company_id=<uuid>&state_id=<uuid>&region_id=<uuid>`
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1 } }
 *       - { in: query, name: searchParam, schema: { type: string }, description: Fuzzy search on vendor_name,email,phone }
 *       - { in: query, name: sortBy, schema: { type: string } }
 *       - { in: query, name: order, schema: { type: string, enum: [ASC, DESC] } }
 *       - { in: query, name: company_id, schema: { type: string, format: uuid }, description: Exact filter }
 *       - { in: query, name: country_id, schema: { type: integer }, description: Exact filter }
 *       - { in: query, name: state_id, schema: { type: string, format: uuid }, description: Exact filter }
 *       - { in: query, name: region_id, schema: { type: string, format: uuid }, description: Exact filter }
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Administration]
 *     summary: Create vendor
 *     description: company_id required (auto-filled from token for non-super admin).
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses: { 201: { description: Created } }
 * /admin/vendors/{id}:
 *   get:
 *     tags: [Administration]
 *     summary: Get vendor by ID
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     responses: { 200: { description: OK } }
 *   put:
 *     tags: [Administration]
 *     summary: Update vendor
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses: { 200: { description: OK } }
 *   delete:
 *     tags: [Administration]
 *     summary: Delete vendor
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     responses: { 200: { description: Deleted } }
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     tags: [Administration]
 *     summary: List users (only Supervisor & Technician)
 *     description: |
 *       Org-scoped. Always restricted to roles **supervisor** and **technician**.
 *       Supports pagination, sorting, fuzzy search, and exact filters.
 *       **Query examples:** `?page=1&limit=10&searchParam=ram&vendor_id=<uuid>`
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1 } }
 *       - { in: query, name: searchParam, schema: { type: string }, description: Fuzzy search on name,email,phone,city }
 *       - { in: query, name: sortBy, schema: { type: string } }
 *       - { in: query, name: order, schema: { type: string, enum: [ASC, DESC] } }
 *       - { in: query, name: company_id, schema: { type: string, format: uuid }, description: Exact filter (super admin only) }
 *       - { in: query, name: role_id, schema: { type: string, format: uuid }, description: Exact filter (must be supervisor or technician) }
 *       - { in: query, name: vendor_id, schema: { type: string, format: uuid }, description: Exact filter }
 *       - { in: query, name: shift_id, schema: { type: string, format: uuid }, description: Exact filter }
 *       - { in: query, name: region_id, schema: { type: string, format: uuid }, description: Exact filter }
 *       - { in: query, name: supervisor_id, schema: { type: string, format: uuid }, description: Exact filter }
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Administration]
 *     summary: Create user
 *     description: |
 *       Org-scoped. `company_id` is required (auto-filled for non-super admin).
 *       If role is **technician** or **supervisor**, `vendor_id` is required and must belong to the same company.
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses: { 201: { description: Created } }
 * /admin/users/{id}:
 *   get:
 *     tags: [Administration]
 *     summary: Get user by ID
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     responses: { 200: { description: OK } }
 *   put:
 *     tags: [Administration]
 *     summary: Update user
 *     description: |
 *       Org-scoped. Cannot change `company_id`. If changing role to supervisor/technician, `vendor_id` must be provided and belong to the same company.
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses: { 200: { description: OK } }
 *   delete:
 *     tags: [Administration]
 *     summary: Delete user
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     responses: { 200: { description: Deleted } }
 */

/**
 * @swagger
 * /admin/clients:
 *   get:
 *     tags: [Administration]
 *     summary: List clients
 *     description: |
 *       Org-scoped. Supports pagination, sorting, fuzzy search, and exact filters.
 *       **Query examples:** `?searchParam=anand&available_status=true`
 *     security: [ { bearerAuth: [] } ]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, minimum: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1 } }
 *       - { in: query, name: searchParam, schema: { type: string }, description: Fuzzy search on firstName,lastName,email,phone,city }
 *       - { in: query, name: sortBy, schema: { type: string } }
 *       - { in: query, name: order, schema: { type: string, enum: [ASC, DESC] } }
 *       - { in: query, name: company_id, schema: { type: string, format: uuid }, description: Exact filter }
 *       - { in: query, name: business_typeId, schema: { type: string, format: uuid }, description: Exact filter }
 *       - { in: query, name: country_id, schema: { type: integer }, description: Exact filter }
 *       - { in: query, name: state_id, schema: { type: string, format: uuid }, description: Exact filter }
 *       - { in: query, name: available_status, schema: { type: boolean }, description: Exact filter }
 *     responses: { 200: { description: OK } }
 *   post:
 *     tags: [Administration]
 *     summary: Create client
 *     description: company_id required (auto-filled from token for non-super admin).
 *     security: [ { bearerAuth: [] } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses: { 201: { description: Created } }
 * /admin/clients/{id}:
 *   get:
 *     tags: [Administration]
 *     summary: Get client by ID
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     responses: { 200: { description: OK } }
 *   put:
 *     tags: [Administration]
 *     summary: Update client
 *     description: Org-scoped. Cannot change `company_id`.
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses: { 200: { description: OK } }
 *   delete:
 *     tags: [Administration]
 *     summary: Delete client
 *     security: [ { bearerAuth: [] } ]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: string, format: uuid } } ]
 *     responses: { 200: { description: Deleted } }
 */

/* ========================= JOBS ========================= */
/**
 * @swagger
 * /jobs:
 *   get:
 *     tags:
 *       - Jobs
 *     summary: List jobs (filters, sorting, pagination)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: searchParam
 *         schema:
 *           type: string
 *         description: Fuzzy search on reference_number.
 *       - in: query
 *         name: client_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: worktype_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: jobtype_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: supervisor_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: technician_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: now_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Nature of work ID
 *       - in: query
 *         name: job_status_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Include jobs with scheduledDateAndTime >= from (ISO 8601)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Include jobs with scheduledDateAndTime <= to (ISO 8601)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 200
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           example: createdAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *   post:
 *     tags:
 *       - Jobs
 *     summary: Create job
 *     description: >
 *       - Non-super admins are auto-scoped to their company_id.
 *       - reference_number is auto-generated if omitted.
 *       - A JobStatusHistory row is created if job_status_id is provided.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               client_id:
 *                 type: string
 *                 format: uuid
 *               worktype_id:
 *                 type: string
 *                 format: uuid
 *               jobtype_id:
 *                 type: string
 *                 format: uuid
 *               supervisor_id:
 *                 type: string
 *                 format: uuid
 *               technician_id:
 *                 type: string
 *                 format: uuid
 *               now_id:
 *                 type: string
 *                 format: uuid
 *               job_status_id:
 *                 type: string
 *                 format: uuid
 *               scheduledDateAndTime:
 *                 type: string
 *                 format: date-time
 *               reference_number:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *           examples:
 *             basic:
 *               value:
 *                 client_id: "b4b3b9a1-0a8c-4a59-9a68-96c8f0d8e1aa"
 *                 worktype_id: "2f2e5a10-6b1e-4bff-bb79-7e0f2c8b43e1"
 *                 jobtype_id: "e7a02d7f-0d2c-4d1b-9b88-a9a5b1f0a1c2"
 *                 now_id: "d3a3f9a1-3b2c-4c5d-8e7f-1a2b3c4d5e6f"
 *                 job_status_id: "f1550a6d-9f7b-49d0-b3a5-1a3d2f4b5c6e"
 *                 scheduledDateAndTime: "2025-08-20T10:30:00.000Z"
 *                 title: "AC not cooling"
 *                 description: "Check filter and gas level"
 *     responses:
 *       201:
 *         description: Created
 * /jobs/{id}:
 *   get:
 *     tags:
 *       - Jobs
 *     summary: Get job (with relations & status history)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 job:
 *                   type: object
 *                 status_history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       job_status_id:
 *                         type: string
 *                         format: uuid
 *                       job_status_title:
 *                         type: string
 *                       is_completed:
 *                         type: boolean
 *                       at:
 *                         type: string
 *                         format: date-time
 *   put:
 *     tags:
 *       - Jobs
 *     summary: Update job (tracks status changes)
 *     description: If job_status_id changes, a new JobStatusHistory row is created.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     tags:
 *       - Jobs
 *     summary: Delete job
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Deleted
 */

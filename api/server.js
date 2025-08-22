const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { kv } = require('@vercel/kv');
const fs = require('fs');
const path = require('path');

// Importar middlewares
const { authenticateToken, generateToken } = require('./middleware/auth');

const app = express();

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://capacitatg.com.br', 'https://www.capacitatg.com.br']
    : true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Arquivos locais para armazenamento (mantido para compatibilidade com o server-local.js)
const COURSES_FILE = path.join(__dirname, 'courses.json');

// Função para ler os cursos do Vercel KV
async function readCourses() {
  try {
    const courses = await kv.get('courses');
    return courses || [];
  } catch (error) {
    console.error('Error reading courses from Vercel KV:', error);
    return [];
  }
}

// Função para escrever os cursos no Vercel KV
async function writeCourses(coursesData) {
  try {
    await kv.set('courses', coursesData);
    return true;
  } catch (error) {
    console.error('Error writing courses to Vercel KV:', error);
    return false;
  }
}

// Função para ler os alunos/atiradores do Vercel KV
async function readStudents() {
  try {
    const students = await kv.get('students');
    return students || [];
  } catch (error) {
    console.error('Error reading students from Vercel KV:', error);
    return [];
  }
}

// Função para escrever os alunos/atiradores no Vercel KV
async function writeStudents(studentsData) {
  try {
    await kv.set('students', studentsData);
    return true;
  } catch (error) {
    console.error('Error writing students to Vercel KV:', error);
    return false;
  }
}

// Função para ler as empresas do Vercel KV
async function readCompanies() {
  try {
    const companies = await kv.get('companies');
    return companies || [];
  } catch (error) {
    console.error('Error reading companies from Vercel KV:', error);
    return [];
  }
}

// Função para escrever as empresas no Vercel KV
async function writeCompanies(companiesData) {
  try {
    await kv.set('companies', companiesData);
    return true;
  } catch (error) {
    console.error('Error writing companies to Vercel KV:', error);
    return false;
  }
}

// Função para gerar um ID único
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// GET /api/courses - Pega todos os cursos
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await readCourses();
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// GET /api/courses/:page - Pega cursos por página
app.get('/api/courses/:page', async (req, res) => {
  try {
    const { page } = req.params;
    const allCourses = await readCourses();
    const filteredCourses = allCourses.filter(course => course.page === page);
    res.json(filteredCourses);
  } catch (error) {
    console.error('Error fetching courses by page:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// POST /api/courses - Adiciona um novo curso (protegido)
app.post('/api/courses', async (req, res) => {
  try {
    const { title, category, description, imageUrl, courseUrl, page, downloadUrl } = req.body;

    if (!title || !category || !description || !imageUrl || !courseUrl || !page) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const allCourses = await readCourses();
    const newCourse = {
      id: generateId(),
      title,
      category,
      description,
      imageUrl,
      courseUrl,
      page,
      downloadUrl,
    };

    allCourses.push(newCourse);
    
    const success = await writeCourses(allCourses);
    if (!success) {
      return res.status(500).json({ error: 'Failed to save course' });
    }

    res.status(201).json(newCourse);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// PUT /api/courses/:id - Atualiza um curso (protegido)
app.put('/api/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, description, imageUrl, courseUrl, page, downloadUrl } = req.body;

    if (!title || !category || !description || !imageUrl || !courseUrl || !page) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const allCourses = await readCourses();
    const courseIndex = allCourses.findIndex(course => course.id === id);

    if (courseIndex === -1) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const updatedCourse = { id, title, category, description, imageUrl, courseUrl, page, downloadUrl };
    allCourses[courseIndex] = updatedCourse;
    
    const success = await writeCourses(allCourses);
    if (!success) {
      return res.status(500).json({ error: 'Failed to update course' });
    }

    res.json(updatedCourse);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// DELETE /api/courses/:id - Deleta um curso (protegido)
app.delete('/api/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const allCourses = await readCourses();
    const courseIndex = allCourses.findIndex(course => course.id === id);

    if (courseIndex === -1) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const deletedCourse = allCourses.splice(courseIndex, 1)[0];
    
    const success = await writeCourses(allCourses);
    if (!success) {
      return res.status(500).json({ error: 'Failed to delete course' });
    }

    res.json({ message: 'Course deleted successfully', course: deletedCourse });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// PUT /api/courses/reorder - Atualiza a ordem dos cursos (MANTIDO DA MAIN)
app.put('/api/courses/reorder', async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'Ordered IDs must be an array' });
    }
    const allCourses = await readCourses();
    const coursesMap = new Map(allCourses.map(course => [course.id, course]));
    const reorderedCourses = orderedIds.map(id => coursesMap.get(id)).filter(Boolean);
    if (reorderedCourses.length !== allCourses.length) {
         return res.status(400).json({ error: 'Incomplete list of courses provided' });
    }
    const success = await writeCourses(reorderedCourses);
    if (!success) {
      return res.status(500).json({ error: 'Failed to save reordered courses' });
    }
    res.json(reorderedCourses);
  } catch (error) {
    console.error('Error reordering courses:', error);
    res.status(500).json({ error: 'Failed to reorder courses' });
  }
});

// POST /api/students - Cadastro de estudante
app.post('/api/students', async (req, res) => {
  try {
    const { nome, cidade, email, telefone, habilidades, experiencia, formacao, senha } = req.body;
    
    // Validação básica
    if (!nome || !cidade || !email || !telefone || !habilidades || !senha) {
      return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
    }
    
    const allStudents = await readStudents();
    
    // Verificar se email já existe
    const existingStudent = allStudents.find(student => student.email.toLowerCase() === email.toLowerCase());
    if (existingStudent) {
      return res.status(409).json({ error: 'Já existe um usuário cadastrado com este email' });
    }
    
    // Hash da senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(senha, saltRounds);
    
    const newStudent = {
      id: generateId(),
      nome: nome.trim(),
      cidade,
      email: email.toLowerCase(),
      telefone,
      habilidades: habilidades.trim(),
      experiencia: experiencia ? experiencia.trim() : '',
      formacao: formacao ? formacao.trim() : '',
      senha: hashedPassword,
      tipo: 'atirador',
      tipoUsuario: 'atirador',
      dataRegistro: new Date().toISOString(),
      ativo: true
    };
    
    allStudents.push(newStudent);
    
    const success = await writeStudents(allStudents);
    if (!success) {
      return res.status(500).json({ error: 'Falha ao salvar dados do estudante' });
    }
    
    // Gerar token JWT
    const token = generateToken(newStudent.id, 'atirador');
    
    // Remover senha da resposta
    const { senha: _, ...studentResponse } = newStudent;
    
    res.status(201).json({
      user: studentResponse,
      token,
      message: 'Cadastro realizado com sucesso!'
    });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/companies - Cadastro de empresa
app.post('/api/companies', async (req, res) => {
  try {
    const { nomeEmpresa, cidade, email, informacoes, senha } = req.body;
    
    // Validação básica
    if (!nomeEmpresa || !cidade || !email || !senha) {
      return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
    }
    
    const allCompanies = await readCompanies();
    
    // Verificar se email já existe
    const existingCompany = allCompanies.find(company => company.email.toLowerCase() === email.toLowerCase());
    if (existingCompany) {
      return res.status(409).json({ error: 'Já existe uma empresa cadastrada com este email' });
    }
    
    // Hash da senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(senha, saltRounds);
    
    const newCompany = {
      id: generateId(),
      nomeEmpresa: nomeEmpresa.trim(),
      nome: nomeEmpresa.trim(), // Alias para compatibilidade
      cidade,
      email: email.toLowerCase(),
      informacoes: informacoes ? informacoes.trim() : '',
      senha: hashedPassword,
      tipo: 'empresa',
      tipoUsuario: 'empregador',
      dataRegistro: new Date().toISOString(),
      ativo: true
    };
    
    allCompanies.push(newCompany);
    
    const success = await writeCompanies(allCompanies);
    if (!success) {
      return res.status(500).json({ error: 'Falha ao salvar dados da empresa' });
    }
    
    // Gerar token JWT
    const token = generateToken(newCompany.id, 'empresa');
    
    // Remover senha da resposta
    const { senha: _, ...companyResponse } = newCompany;
    
    res.status(201).json({
      user: companyResponse,
      token,
      message: 'Cadastro realizado com sucesso!'
    });
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/login - Login de usuário
app.post('/api/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const allStudents = await readStudents();
    const allCompanies = await readCompanies();

    // Procurar por um estudante com o email
    let user = allStudents.find(s => s.email.toLowerCase() === email.toLowerCase());
    let userType = 'atirador';
    
    // Se não encontrou estudante, procurar empresa
    if (!user) {
      user = allCompanies.find(c => c.email.toLowerCase() === email.toLowerCase());
      userType = 'empresa';
    }

    if (!user) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // Verificar se o usuário está ativo
    if (!user.ativo) {
      return res.status(401).json({ error: 'Conta desativada. Entre em contato com o suporte.' });
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(senha, user.senha);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    // Gerar token JWT
    const token = generateToken(user.id, userType);
    
    // Atualizar último login
    user.ultimoLogin = new Date().toISOString();
    
    if (userType === 'atirador') {
      const studentIndex = allStudents.findIndex(s => s.id === user.id);
      allStudents[studentIndex] = user;
      await writeStudents(allStudents);
    } else {
      const companyIndex = allCompanies.findIndex(c => c.id === user.id);
      allCompanies[companyIndex] = user;
      await writeCompanies(allCompanies);
    }

    // Remover senha da resposta
    const { senha: _, ...userResponse } = user;
    
    res.json({
      user: userResponse,
      token,
      message: 'Login realizado com sucesso!'
    });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/profile - Obter perfil do usuário autenticado
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { senha: _, ...userProfile } = req.user;
    res.json(userProfile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

// PUT /api/profile - Atualizar perfil do usuário autenticado
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.tipo;
    const updates = req.body;
    
    // Remover campos que não devem ser atualizados
    delete updates.id;
    delete updates.senha;
    delete updates.email;
    delete updates.tipo;
    delete updates.tipoUsuario;
    delete updates.dataRegistro;
    
    if (userType === 'atirador') {
      const allStudents = await readStudents();
      const studentIndex = allStudents.findIndex(s => s.id === userId);
      
      if (studentIndex === -1) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      
      allStudents[studentIndex] = { ...allStudents[studentIndex], ...updates };
      await writeStudents(allStudents);
      
      const { senha: _, ...updatedUser } = allStudents[studentIndex];
      res.json(updatedUser);
    } else {
      const allCompanies = await readCompanies();
      const companyIndex = allCompanies.findIndex(c => c.id === userId);
      
      if (companyIndex === -1) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }
      
      allCompanies[companyIndex] = { ...allCompanies[companyIndex], ...updates };
      await writeCompanies(allCompanies);
      
      const { senha: _, ...updatedUser } = allCompanies[companyIndex];
      res.json(updatedUser);
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

// POST /api/logout - Logout (invalidar token no cliente)
app.post('/api/logout', (req, res) => {
  res.json({ message: 'Logout realizado com sucesso!' });
});

// GET /api/students - Pega todos os alunos (protegido)
app.get('/api/students', async (req, res) => {
  try {
    const students = await readStudents();
    // Remover senhas da resposta
    const studentsWithoutPasswords = students.map(({ senha, ...student }) => student);
    res.json(studentsWithoutPasswords);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// GET /api/companies - Pega todas as empresas (protegido)
app.get('/api/companies', async (req, res) => {
  try {
    const companies = await readCompanies();
    // Remover senhas da resposta
    const companiesWithoutPasswords = companies.map(({ senha, ...company }) => company);
    res.json(companiesWithoutPasswords);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Exporta o app para a Vercel
module.exports = app;
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BooksComponent } from './components/books/books.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AdminComponent } from './components/admin/admin.component';
import { AdminLibrosComponent } from './components/admin-libros/admin-libros.component';
import { AdminCategoriasComponent } from './components/admin-categorias/admin-categorias.component';
import { AdminUsuariosComponent } from './components/admin-usuarios/admin-usuarios.component';
import { AdminPrestamosComponent } from './components/admin-prestamos/admin-prestamos.component';
import { HistorialPrestamosComponent } from './components/historial-prestamos/historial-prestamos.component';

const routes: Routes = [
  { path: '', component: BooksComponent },
  { path: 'libros', component: BooksComponent },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegisterComponent },
  { path: 'mi-historial', component: HistorialPrestamosComponent },
  {
    path: 'admin',
    component: AdminComponent,
    children: [
      { path: '', redirectTo: 'libros', pathMatch: 'full' },
      { path: 'libros', component: AdminLibrosComponent },
      { path: 'categorias', component: AdminCategoriasComponent },
      { path: 'usuarios', component: AdminUsuariosComponent },
      { path: 'prestamos', component: AdminPrestamosComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }



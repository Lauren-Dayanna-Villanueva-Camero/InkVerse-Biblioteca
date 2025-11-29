import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { BooksComponent } from './components/books/books.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AdminComponent } from './components/admin/admin.component';
import { AdminLibrosComponent } from './components/admin-libros/admin-libros.component';
import { AdminCategoriasComponent } from './components/admin-categorias/admin-categorias.component';
import { AdminUsuariosComponent } from './components/admin-usuarios/admin-usuarios.component';
import { AdminPrestamosComponent } from './components/admin-prestamos/admin-prestamos.component';
import { HistorialPrestamosComponent } from './components/historial-prestamos/historial-prestamos.component';
import { LoginModalComponent } from './components/login-modal/login-modal.component';
import { RegisterModalComponent } from './components/register-modal/register-modal.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    BooksComponent,
    LoginComponent,
    RegisterComponent,
    AdminComponent,
    AdminLibrosComponent,
    AdminCategoriasComponent,
    AdminUsuariosComponent,
    AdminPrestamosComponent,
    HistorialPrestamosComponent,
    LoginModalComponent,
    RegisterModalComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    AppRoutingModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }



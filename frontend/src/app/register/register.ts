import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../services/auth';
import { EmailRulesService, EmailDomainRule, EmailValidationConfig } from '../services/email-rules.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register implements OnInit {
  registerForm: FormGroup;
  emailRules: EmailDomainRule[] = [];
  selectedRule: EmailDomainRule | null = null;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  isPending = false;
  
  // Add these properties for password visibility
  showPassword = false;
  showConfirmPassword = false;
  
  // Add this for debugging
  apiError = false;
  
  departments = [
  'Human Resources',
  'Information Technology', 
  'Finance', 
  'Sales', 
  'Operations', 
  'Marketing', 
  'Legal'
];
  roles = [
    { value: 'Employee', label: 'Employee', description: 'Regular employee - immediate access' },
    { value: 'Supervisor', label: 'Supervisor', description: 'Team supervisor - requires approval' },
    { value: 'Manager', label: 'Manager', description: 'Department manager - requires approval' },
    { value: 'Admin', label: 'Admin', description: 'Administrator - requires approval' }
  ];
  
  today = new Date().toISOString().split('T')[0];

  constructor(
    private fb: FormBuilder,
    private authService: Auth,
    private emailRulesService: EmailRulesService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      name: ['', [Validators.required]],
      department: ['', [Validators.required]],
      gender: ['', [Validators.required]],
      dateOfBirth: ['', [Validators.required]],
      emailType: ['', [Validators.required]],
      requestedRole: ['Employee', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadEmailRules();
  }

  private loadEmailRules(): void {
    console.log('Loading email rules...');
    
    this.emailRulesService.getEmailRules().subscribe({
      next: (config: EmailValidationConfig) => {
        console.log('Email rules loaded successfully:', config);
        
        if (config && config.rules) {
          this.emailRules = config.rules.filter(rule => rule.isActive);
          console.log('Active rules:', this.emailRules);
          
          if (this.emailRules.length === 0) {
            this.errorMessage = 'No email validation rules are active. Please contact administrator.';
          }
        } else {
          this.errorMessage = 'Invalid email configuration received.';
        }
      },
      error: (error) => {
        console.error('❌ Failed to load email rules:', error);
        console.error('Status:', error.status);
        console.error('Status text:', error.statusText);
        console.error('URL:', error.url);
        
        this.apiError = true;
        
        // Fallback to default rules for testing
        this.emailRules = [
          {
            name: 'Employees',
            allowedDomains: ['company.com', 'company.co.za'],
            usernamePattern: '^[a-zA-Z]+\\.[a-zA-Z]+$',
            description: 'firstname.lastname@company.com',
            isActive: true
          },
          {
            name: 'External',
            allowedDomains: ['gmail.com', 'outlook.com', 'yahoo.com'],
            usernamePattern: null,
            description: 'Personal email providers',
            isActive: true
          }
        ];
        
        this.errorMessage = 'Using default email rules. API connection failed.';
      }
    });
  }

  private passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onEmailTypeChange(): void {
    const ruleName = this.registerForm.get('emailType')?.value;
    this.selectedRule = this.emailRules.find(rule => rule.name === ruleName) || null;
    this.registerForm.get('email')?.setValue('');
    this.updateEmailValidators();
  }

  private updateEmailValidators(): void {
    const emailControl = this.registerForm.get('email');
    
    if (this.selectedRule) {
      emailControl?.setValidators([
        Validators.required,
        this.createEmailValidator(this.selectedRule)
      ]);
    } else {
      emailControl?.setValidators([Validators.required, Validators.email]);
    }
    
    emailControl?.updateValueAndValidity();
  }

  private createEmailValidator(rule: EmailDomainRule): any {
    return (control: any) => {
      const email = control.value;
      if (!email) return null;

      const [username, domain] = email.split('@');
      
      if (!username || !domain) {
        return { invalidFormat: true };
      }

      if (!rule.allowedDomains.includes(domain)) {
        return { 
          invalidDomain: {
            allowed: rule.allowedDomains.join(', '),
            received: domain
          }
        };
      }

      if (rule.usernamePattern) {
        const pattern = new RegExp(rule.usernamePattern);
        if (!pattern.test(username)) {
          return { 
            invalidUsername: {
              pattern: rule.description,
              received: username
            }
          };
        }
      }

      return null;
    };
  }

  getEmailErrorMessage(): string {
    const emailControl = this.registerForm.get('email');
    if (!emailControl?.errors || !this.selectedRule) return '';

    if (emailControl.errors['invalidDomain']) {
      return `Email must be from: ${emailControl.errors['invalidDomain'].allowed}`;
    }
    
    if (emailControl.errors['invalidUsername']) {
      return `Username format: ${emailControl.errors['invalidUsername'].pattern}`;
    }

    if (emailControl.errors['invalidFormat']) {
      return 'Please enter a valid email address';
    }

    return '';
  }

  getRoleDescription(roleValue: string): string {
    const role = this.roles.find(r => r.value === roleValue);
    return role ? role.description : '';
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.isPending = false;

    const formValue = this.registerForm.value;
    
    const registerData = {
      email: formValue.email,
      password: formValue.password,
      name: formValue.name,
      department: formValue.department,
      gender: formValue.gender,
      dateOfBirth: new Date(formValue.dateOfBirth).toISOString(),
      requestedRole: formValue.requestedRole
    };

    console.log('Submitting registration:', registerData);

    this.authService.register(registerData).subscribe({
      next: (response: any) => {
        console.log('Registration response:', response);
        
        if (response.isApproved === false) {
          // User needs approval
          this.isPending = true;
          this.successMessage = response.message || 'Registration submitted for approval. You will be notified once approved.';
          this.isLoading = false;
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        } else {
          // Auto-approved (Employee or first user)
          this.successMessage = 'Registration successful! Redirecting to dashboard...';
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 2000);
        }
      },
      error: (error) => {
        console.error('Registration failed:', error);
        console.error('Status:', error.status);
        console.error('Error details:', error.error);
        
        this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
        this.isLoading = false;
      }
    });
  }
}
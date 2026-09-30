import fitz
from pathlib import Path

SAMPLE_DIR = Path(__file__).resolve().parent.parent / "sample_data"
SAMPLE_DIR.mkdir(parents=True, exist_ok=True)

def create_quantum_mechanics_pdf():
    doc = fitz.open()
    
    # Page 1: Chapter 1: Wave-Particle Duality & Schrödinger Equation
    p1 = doc.new_page()
    rect1 = fitz.Rect(50, 50, 545, 792)
    
    text_p1 = """Engineering Physics: Quantum Mechanics Fundamentals
Unit 1: Quantum Foundations

1.1 Wave-Particle Duality and de Broglie Wavelength
In 1924, Louis de Broglie postulated that matter exhibits wave-particle duality. The de Broglie wavelength lambda is given by:
lambda = h / p = h / (m * v)
where h is Planck's constant (6.626e-34 J s), p is momentum, m is particle mass, and v is velocity.

For an electron accelerated through potential difference V, the kinetic energy is E = q * V = (1/2) * m * v^2.
Therefore, the wavelength can be expressed as:
lambda = h / sqrt(2 * m * q * V)

1.2 The Time-Dependent Schrödinger Equation
The central equation of non-relativistic quantum mechanics is the Time-Dependent Schrödinger Equation (TDSE):
i * hbar * (partial psi / partial t) = - (hbar^2 / (2 * m)) * (nabla^2 psi) + V(r, t) * psi
where psi(r, t) is the complex wavefunction, hbar = h / (2 * pi) is the reduced Planck constant, and V(r, t) is the potential energy.

The physical interpretation given by Max Born states that |psi(r, t)|^2 represents the probability density of finding the particle at position r and time t:
P(r) = |psi(r, t)|^2 = psi^* * psi
The total probability integrated over all space must equal 1 (Normalization Condition):
int |psi(r, t)|^2 dV = 1
"""
    p1.insert_text((50, 70), text_p1, fontsize=11, fontname="helv")

    # Page 2: Chapter 2: Infinite Potential Well (Particle in a Box)
    p2 = doc.new_page()
    text_p2 = """Unit 2: One-Dimensional Bound Systems

2.1 Particle in a 1D Infinite Potential Well
Consider a particle of mass m confined to a 1D box with potential:
V(x) = 0 for 0 <= x <= L
V(x) = infinity for x < 0 or x > L

Inside the well, the Time-Independent Schrödinger Equation (TISE) simplifies to:
- (hbar^2 / (2 * m)) * (d^2 psi / dx^2) = E * psi
d^2 psi / dx^2 + k^2 * psi = 0, where k^2 = 2 * m * E / hbar^2

Applying boundary conditions psi(0) = 0 and psi(L) = 0 yields discrete energy eigenvalues:
E_n = (n^2 * pi^2 * hbar^2) / (2 * m * L^2) = (n^2 * h^2) / (8 * m * L^2), for n = 1, 2, 3...

The normalized wavefunctions are:
psi_n(x) = sqrt(2 / L) * sin(n * pi * x / L)

Summary of Energy Levels:
Level n = 1 (Ground state): E_1 = h^2 / (8 * m * L^2), Zero-point energy
Level n = 2 (First excited): E_2 = 4 * E_1
Level n = 3 (Second excited): E_3 = 9 * E_1

2.2 Quantum Tunneling and Barrier Penetration
When a particle with energy E encounters a rectangular potential barrier of height V_0 where E < V_0, classical mechanics predicts 100% reflection. However, in quantum mechanics, the wavefunction penetrates the barrier with exponential decay:
psi(x) ~ exp(-alpha * x), where alpha = sqrt(2 * m * (V_0 - E)) / hbar
Transmission coefficient T is non-zero:
T approx 16 * (E / V_0) * (1 - E / V_0) * exp(-2 * alpha * a)
where a is the barrier width. This phenomenon explains alpha decay in radioactive nuclei and scanning tunneling microscopy (STM).
"""
    p2.insert_text((50, 70), text_p2, fontsize=11, fontname="helv")
    
    pdf_path = SAMPLE_DIR / "quantum_mechanics_intro.pdf"
    doc.save(str(pdf_path))
    doc.close()
    print(f"Created {pdf_path}")

def create_neural_networks_pdf():
    doc = fitz.open()
    
    # Page 1: Neural Networks Foundations
    p1 = doc.new_page()
    text_p1 = """CS401: Deep Learning and Neural Computation
Unit 1: Perceptrons and Activation Functions

1.1 Biological Neuron to Artificial Perceptron
An artificial neuron computes the weighted sum of its inputs plus a bias term, passed through a non-linear activation function sigma:
z = sum(w_i * x_i) + b = w^T * x + b
y_hat = sigma(z)

Common Activation Functions:
1. Sigmoid: sigma(z) = 1 / (1 + exp(-z)), range (0, 1)
2. Hyperbolic Tangent (Tanh): tanh(z) = (exp(z) - exp(-z)) / (exp(z) + exp(-z)), range (-1, 1)
3. Rectified Linear Unit (ReLU): ReLU(z) = max(0, z), solves vanishing gradient for positive activations
4. Leaky ReLU: LeakyReLU(z) = max(alpha * z, z) where alpha = 0.01

1.2 Loss Functions in Supervised Learning
For binary classification: Binary Cross-Entropy (BCE) Loss
L_BCE = - [y * log(y_hat) + (1 - y) * log(1 - y_hat)]

For regression: Mean Squared Error (MSE) Loss
L_MSE = (1 / (2 * N)) * sum((y_i - y_hat_i)^2)
"""
    p1.insert_text((50, 70), text_p1, fontsize=11, fontname="helv")

    # Page 2: Backpropagation and Optimization
    p2 = doc.new_page()
    text_p2 = """Unit 2: Optimization and Regularization

2.1 The Backpropagation Algorithm
Backpropagation computes partial derivatives of the loss L with respect to all network weights using the chain rule of calculus:
dL / dw_ij = (dL / dz_j) * (dz_j / dw_ij) = delta_j * a_i
where delta_j is the error term of layer j.

Gradient Descent Weight Update Rule:
w_new = w_old - eta * (dL / dw)
where eta is the learning rate parameter.

2.2 Overfitting and Regularization Techniques
Overfitting occurs when a neural network achieves very low training error but fails to generalize to unseen test data.
Techniques to prevent overfitting:
1. L2 Regularization (Weight Decay): Adds penalty term (lambda / 2) * sum(w_i^2) to loss function.
2. Dropout: Randomly sets a fraction p of hidden units to zero during each training forward pass.
3. Early Stopping: Halts training when validation loss stops improving for a specified patience threshold.
4. Data Augmentation: Synthesizes modified training examples via rotation, cropping, and noise injection.
"""
    p2.insert_text((50, 70), text_p2, fontsize=11, fontname="helv")
    
    pdf_path = SAMPLE_DIR / "neural_networks_basics.pdf"
    doc.save(str(pdf_path))
    doc.close()
    print(f"Created {pdf_path}")

if __name__ == "__main__":
    create_quantum_mechanics_pdf()
    create_neural_networks_pdf()

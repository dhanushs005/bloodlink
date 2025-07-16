import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { User, Droplet, Users, AlertTriangle, MapPin, Phone, Hospital, Mail, HeartHandshake, ShieldCheck, Sun, Moon } from 'lucide-react';
// Note: GSAP imports are removed to fix the build error.
// The code now expects GSAP and ScrollTrigger to be available globally (e.g., from a CDN script).

// Main App Component
export default function App() {
  const [page, setPage] = useState('home');
  const [donors, setDonors] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [reports, setReports] = useState({});
  const [darkMode, setDarkMode] = useState(false);
  const mainContainerRef = useRef(null);

  // --- Backend Integration ---
  useEffect(() => {
    // Fetch initial data when the app loads
    fetch('/api/donors').then(res => res.json()).then(setDonors).catch(console.error);
    fetch('/api/emergencies').then(res => res.json()).then(setEmergencies).catch(console.error);
  }, []);

  const navigateTo = (pageName) => {
    window.location.hash = pageName;
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setPage(hash || 'home');
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  // Animate page transitions
  useLayoutEffect(() => {
    if (mainContainerRef.current && typeof gsap !== 'undefined') {
        gsap.fromTo(mainContainerRef.current, 
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
        );
    }
  }, [page]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const addDonor = (donor) => {
    fetch('/api/donors', { 
      method: 'POST', 
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify(donor) 
    })
    .then(res => res.json())
    .then(newDonor => {
        setDonors(prev => [...prev, newDonor]);
        alert('Donor registered successfully!');
        navigateTo('donors');
    })
    .catch(err => {
        console.error("Failed to add donor:", err);
        alert('Failed to register donor.');
    });
  };

  const addEmergency = (emergency) => {
    fetch('/api/emergencies', { 
      method: 'POST', 
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify(emergency) 
    })
    .then(res => res.json())
    .then(newEmergency => {
        setEmergencies(prev => [...prev, newEmergency]);
        alert('Emergency request posted!');
        checkAndNotifyForEmergency(newEmergency);
    })
    .catch(err => {
        console.error("Failed to post emergency:", err);
        alert('Failed to post emergency.');
    });
  };

  const reportDonor = (uniqueID) => {
    if (!donors.find(d => d._id === uniqueID)) {
      alert('Error: Invalid Unique ID.');
      return;
    }
    
    fetch(`/api/report/${uniqueID}`, { method: 'POST' })
    .then(res => res.json())
    .then(data => {
        if(data.removed) {
            setDonors(prev => prev.filter(donor => donor._id !== uniqueID));
            alert(`Donor ${uniqueID} has been reported 3 times and is now removed.`);
        } else {
            alert(`Thank you for your report. Donor ${uniqueID} has been reported ${data.reportCount} time(s).`);
        }
    }).catch(err => {
        console.error("Failed to report donor:", err);
        alert('Failed to submit report.');
    });
  };
  
  const checkAndNotifyForEmergency = (emergency) => {
    if (!('Notification' in window)) return;
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        navigator.geolocation.getCurrentPosition(position => {
          const userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
          const distance = getDistance(userLocation, emergency.location);
          if (distance < 20) { // 20 km radius
            new Notification("Urgent Blood Requirement Nearby!", {
              body: `Blood Type: ${emergency.blood_type}\nHospital: ${emergency.hospital}`,
              icon: 'https://i.imgur.com/SCLJb3i.png'
            });
          }
        });
      }
    });
  };

  const getDistance = (loc1, loc2) => {
    if(!loc1 || !loc2) return Infinity;
    const R = 6371; // km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(loc1.lat*Math.PI/180)*Math.cos(loc2.lat*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return (
    <div className={`min-h-screen font-sans bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-500`}>
      <Navbar navigateTo={navigateTo} darkMode={darkMode} setDarkMode={setDarkMode} />
      <main ref={mainContainerRef} className="p-4 md:p-8">
        {page === 'home' && <Home navigateTo={navigateTo} />}
        {page === 'donate' && <DonateForm addDonor={addDonor} />}
        {page === 'donors' && <DonorsList donors={donors} />}
        {page === 'emergency' && <EmergencyForm addEmergency={addEmergency} />}
        {page === 'report' && <ReportForm reportDonor={reportDonor} />}
      </main>
      <Footer />
    </div>
  );
}

// --- Components (Navbar, Forms, etc.) ---

// Updated Home Component with GSAP
const Home = ({ navigateTo }) => {
    const heroRef = useRef(null);
    const cardsRef = useRef(null);

    useLayoutEffect(() => {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.warn("GSAP or ScrollTrigger not found, skipping animations.");
            return;
        }
        gsap.registerPlugin(ScrollTrigger); // Register plugin here

        const ctx = gsap.context(() => {
            gsap.from(".hero-title", { opacity: 0, y: 50, duration: 1, ease: 'power3.out' });
            gsap.from(".hero-p", { opacity: 0, y: 50, duration: 1, ease: 'power3.out', delay: 0.3 });
            gsap.from(".hero-btn", { opacity: 0, scale: 0.8, duration: 0.8, ease: 'back.out(1.7)', stagger: 0.2, delay: 0.6 });

            gsap.from(".info-card", {
                scrollTrigger: {
                    trigger: cardsRef.current,
                    start: "top 80%",
                    toggleActions: "play none none none"
                },
                opacity: 0,
                y: 60,
                stagger: 0.3,
                duration: 0.8,
                ease: 'power3.out'
            });
        }, heroRef);
        return () => {
            if (ctx) ctx.revert();
        };
    }, []);

    return (
        <div ref={heroRef} className="text-center">
            <div className="relative bg-red-500 dark:bg-red-700 text-white py-20 px-4 rounded-lg shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-20"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-4 hero-title">Your Drop of Blood Can Save a Life</h1>
                    <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto hero-p">Join our community of heroes. Donate blood, save lives. Post an emergency request when in need.</p>
                    <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-4">
                        <button onClick={() => navigateTo('donate')} className="hero-btn bg-white text-red-500 font-bold py-3 px-8 rounded-full text-lg hover:bg-gray-200 transform hover:scale-105 transition-transform duration-300 shadow-lg flex items-center space-x-2">
                            <HeartHandshake /><span>Donate Now</span>
                        </button>
                        <button onClick={() => navigateTo('emergency')} className="hero-btn border-2 border-white text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-white hover:text-red-500 transform hover:scale-105 transition-transform duration-300 shadow-lg flex items-center space-x-2">
                            <AlertTriangle /><span>Emergency Request</span>
                        </button>
                    </div>
                </div>
            </div>
            
            <div ref={cardsRef} className="py-16">
                <h2 className="text-3xl font-bold mb-10">How It Works</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="info-card p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                        <Users className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Register as a Donor</h3>
                        <p className="text-gray-600 dark:text-gray-400">Create your profile in minutes. Your information helps us find a match quickly in emergencies.</p>
                    </div>
                    <div className="info-card p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Post an Emergency</h3>
                        <p className="text-gray-600 dark:text-gray-400">When you need blood, post a request. We'll alert nearby donors who match the required blood type.</p>
                    </div>
                    <div className="info-card p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                        <ShieldCheck className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Get Notified & Save Lives</h3>
                        <p className="text-gray-600 dark:text-gray-400">If you are a match for an emergency near you, you'll receive a notification. Your timely help can be a lifesaver.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};


// Updated DonorsList with GSAP animations
const DonorsList = ({ donors }) => {
    const listRef = useRef(null);

    useLayoutEffect(() => {
        if (typeof gsap === 'undefined') {
            console.warn("GSAP not found, skipping animations.");
            return;
        }
        if (!listRef.current) return;
        const ctx = gsap.context(() => {
            gsap.from(".donor-row", {
                opacity: 0,
                x: -50,
                stagger: 0.1,
                duration: 0.5,
                ease: 'power3.out'
            });
        }, listRef);
        return () => {
            if(ctx) ctx.revert();
        };
    }, [donors]);

    return (
        <div ref={listRef} className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8 text-red-500">Available Donors</h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                {['Name', 'Blood Type', 'Gender', 'Contact', 'Unique ID'].map(header => (
                                    <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {donors.map((donor) => (
                                <tr key={donor._id} className="donor-row hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{donor.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">{donor.blood_type}</span></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{donor.gender}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{donor.mobile_no}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 font-mono">{donor._id}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Navbar Component
const Navbar = ({ navigateTo, darkMode, setDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navLinks = [
    { name: 'Home', page: 'home' },
    { name: 'Become a Donor', page: 'donate' },
    { name: 'Find Donors', page: 'donors' },
    { name: 'Emergency', page: 'emergency' },
    { name: 'Report', page: 'report' },
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <a href="#home" onClick={(e) => { e.preventDefault(); navigateTo('home'); }} className="flex-shrink-0 flex items-center space-x-2">
              <Droplet className="h-8 w-8 text-red-500" />
              <span className="font-bold text-xl text-red-500">BloodLink</span>
            </a>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navLinks.map(link => (
                <a key={link.name} href={`#${link.page}`} onClick={(e) => { e.preventDefault(); navigateTo(link.page); }} className="text-gray-600 dark:text-gray-300 hover:bg-red-500 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  {link.name}
                </a>
              ))}
            </div>
          </div>
           <div className="flex items-center">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none">
              {darkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
            </button>
            <div className="md:hidden ml-2">
                <button onClick={() => setIsOpen(!isOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-red-500 focus:outline-none">
                <span className="sr-only">Open main menu</span>
                {isOpen ? (
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                )}
                </button>
            </div>
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map(link => (
              <a key={link.name} href={`#${link.page}`} onClick={(e) => { e.preventDefault(); navigateTo(link.page); setIsOpen(false); }} className="text-gray-600 dark:text-gray-300 hover:bg-red-500 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors">
                {link.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

// Base Form Component
const FormContainer = ({ title, children, onSubmit }) => (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center text-red-500 mb-8">{title}</h2>
        <form onSubmit={onSubmit} className="space-y-6">
            {children}
        </form>
    </div>
);
const InputField = ({ id, label, type, value, onChange, required = true, icon, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">{icon}</span>
            <input type={type} id={id} name={id} value={value} onChange={onChange} required={required} className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm bg-gray-50 dark:bg-gray-700" {...props}/>
        </div>
    </div>
);
const SelectField = ({ id, label, value, onChange, options, required = true, icon }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">{icon}</span>
            <select id={id} name={id} value={value} onChange={onChange} required={required} className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm bg-gray-50 dark:bg-gray-700">
                <option value="" disabled>Select {label}</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
    </div>
);

// Donate Form Component
const DonateForm = ({ addDonor }) => {
  const [formData, setFormData] = useState({ name: '', mobile_no: '', email: '', blood_type: '', dob: '', gender: '' });
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Click to get your location');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
    } else {
      setLocationStatus('Locating...');
      navigator.geolocation.getCurrentPosition((position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationStatus('Location captured!');
      }, () => {
        setLocationStatus('Unable to retrieve your location. Please enable permissions.');
      });
    }
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!location) {
      alert('Please provide your location to register.');
      return;
    }
    addDonor({ ...formData, location });
  };
  return (
    <FormContainer title="Become a Blood Donor" onSubmit={handleSubmit}>
      <InputField id="name" label="Full Name" type="text" value={formData.name} onChange={handleChange} placeholder="John Doe" icon={<User className="h-5 w-5 text-gray-400" />} />
      <InputField id="mobile_no" label="Mobile Number" type="tel" value={formData.mobile_no} onChange={handleChange} placeholder="123-456-7890" icon={<Phone className="h-5 w-5 text-gray-400" />} />
      <InputField id="email" label="Email Address" type="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" icon={<Mail className="h-5 w-5 text-gray-400" />} />
      <SelectField id="blood_type" label="Blood Type" value={formData.blood_type} onChange={handleChange} options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} icon={<Droplet className="h-5 w-5 text-gray-400" />} />
      <InputField id="dob" label="Date of Birth" type="date" value={formData.dob} onChange={handleChange} icon={<User className="h-5 w-5 text-gray-400" />} />
      <SelectField id="gender" label="Gender" value={formData.gender} onChange={handleChange} options={['Male', 'Female', 'Other']} icon={<Users className="h-5 w-5 text-gray-400" />} />
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
        <div className="flex items-center space-x-4">
            <button type="button" onClick={handleGetLocation} className="flex-grow flex items-center justify-center space-x-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                <MapPin className="h-5 w-5" /><span>{locationStatus}</span>
            </button>
        </div>
      </div>
      <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-transform transform hover:scale-105">Register as Donor</button>
    </FormContainer>
  );
};

// Emergency Form Component
const EmergencyForm = ({ addEmergency }) => {
  const [formData, setFormData] = useState({ pname: '', contact: '', hospital: '', blood_type: '', units: '' });
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Click to get patient location');
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleGetLocation = () => {
    if (!navigator.geolocation) { setLocationStatus('Geolocation is not supported by your browser.');
    } else {
      setLocationStatus('Locating...');
      navigator.geolocation.getCurrentPosition((position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationStatus('Location captured!');
      }, () => { setLocationStatus('Unable to retrieve location.'); });
    }
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!location) { alert('Please provide the patient\'s location.'); return; }
    addEmergency({ ...formData, location });
  };
  return (
    <FormContainer title="Emergency Blood Request" onSubmit={handleSubmit}>
      <InputField id="pname" label="Patient Name" type="text" value={formData.pname} onChange={handleChange} placeholder="Patient Name" icon={<User className="h-5 w-5 text-gray-400" />} />
      <InputField id="contact" label="Contact Number" type="tel" value={formData.contact} onChange={handleChange} placeholder="Contact Number" icon={<Phone className="h-5 w-5 text-gray-400" />} />
      <InputField id="hospital" label="Hospital Name & Address" type="text" value={formData.hospital} onChange={handleChange} placeholder="City Hospital, Salem" icon={<Hospital className="h-5 w-5 text-gray-400" />} />
      <SelectField id="blood_type" label="Blood Type Needed" value={formData.blood_type} onChange={handleChange} options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} icon={<Droplet className="h-5 w-5 text-gray-400" />} />
      <InputField id="units" label="Number of Units" type="number" value={formData.units} onChange={handleChange} placeholder="e.g., 2" min="1" icon={<Droplet className="h-5 w-5 text-gray-400" />} />
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Patient Location</label>
        <div className="flex items-center space-x-4">
            <button type="button" onClick={handleGetLocation} className="flex-grow flex items-center justify-center space-x-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                <MapPin className="h-5 w-5" /><span>{locationStatus}</span>
            </button>
        </div>
      </div>
      <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-transform transform hover:scale-105">Post Emergency Request</button>
    </FormContainer>
  );
};

// Report Form Component
const ReportForm = ({ reportDonor }) => {
  const [uniqueID, setUniqueID] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (uniqueID.trim() === '') { alert("Please enter a Unique ID."); return; }
    reportDonor(uniqueID.trim());
    setUniqueID('');
  };
  return (
    <FormContainer title="Report Invalid Data" onSubmit={handleSubmit}>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-4">If you find a donor's information to be incorrect or unresponsive, please report them using their Unique ID. A donor will be removed after 3 reports.</p>
      <InputField id="uniqueID" label="Donor's Unique ID" type="text" value={uniqueID} onChange={(e) => setUniqueID(e.target.value)} placeholder="Enter the donor's unique ID from the list" icon={<ShieldCheck className="h-5 w-5 text-gray-400" />}/>
      <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-transform transform hover:scale-105">Submit Report</button>
    </FormContainer>
  );
};

// Footer Component
const Footer = () => (
    <footer className="bg-white dark:bg-gray-800 mt-12 py-6 border-t dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 dark:text-gray-400">
            <p>&copy; {new Date().getFullYear()} BloodLink. All rights reserved.</p>
            <p className="text-sm mt-1">Saving lives, one drop at a time. ❤️</p>
        </div>
    </footer>
);

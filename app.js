// Helpers
const toOctets = (ip) => ip.split('.').map(n => Number(n));
const isValidIPv4 = (ip) => {
  const parts = toOctets(ip);
  if (parts.length !== 4) return false;
  return parts.every(p => Number.isInteger(p) && p >= 0 && p <= 255);
};
const cidrToMask = (cidr) => {
  let mask = [0,0,0,0];
  for (let i = 0; i < 32; i++) {
    if (i < cidr) mask[Math.floor(i/8)] |= 1 << (7 - (i % 8));
  }
  return mask.join('.');
};
const maskToWildcard = (mask) =>
  mask.split('.').map(o => 255 - Number(o)).join('.');

const octetsToInt = (o) => ((o<<24)>>>0) + (o[12]<<16) + (o[13]<<8) + o[14];
const intToIP = (n) =>
  [ (n>>>24)&255, (n>>>16)&255, (n>>>8)&255, n&255 ].join('.');

const networkAddress = (ipInt, cidr) => {
  const maskInt = cidr === 0 ? 0 : (0xFFFFFFFF << (32 - cidr)) >>> 0;
  return ipInt & maskInt;
};
const broadcastAddress = (ipInt, cidr) => {
  const maskInt = cidr === 0 ? 0 : (0xFFFFFFFF << (32 - cidr)) >>> 0;
  const inv = (~maskInt) >>> 0;
  return (ipInt & maskInt) | inv;
};
const ipClass = (firstOctet) => {
  if (firstOctet <= 127) return 'A';
  if (firstOctet <= 191) return 'B';
  if (firstOctet <= 223) return 'C';
  if (firstOctet <= 239) return 'D (Multicast)';
  return 'E (Experimental)';
};
const ipType = (ip) => {
  const [a,b] = toOctets(ip);
  if (a === 10) return 'Private';
  if (a === 172 && b >= 16 && b <= 31) return 'Private';
  if (a === 192 && b === 168) return 'Private';
  if (a === 127) return 'Loopback';
  return 'Public/Other';
};
const toBinary = (ip, mask) => {
  const ipb = toOctets(ip).map(o => o.toString(2).padStart(8,'0')).join('.');
  const mb = mask.split('.').map(o => Number(o).toString(2).padStart(8,'0')).join('.');
  return `IP:      ${ipb}\nMASK:    ${mb}`;
};

// DOM
const form = document.getElementById('calc-form');
const clearBtn = document.getElementById('clear');
const results = document.getElementById('results');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const ip = document.getElementById('ip').value.trim();
  const cidrStr = document.getElementById('cidr').value.trim();

  if (!isValidIPv4(ip)) {
    alert('Please enter a valid IPv4 address.');
    return;
  }
  const cidr = Number(cidrStr);
  if (!Number.isInteger(cidr) || cidr < 0 || cidr > 32) {
    alert('Please enter a valid prefix length from 0 to 32.');
    return;
  }

  const ipInt = octetsToInt(toOctets(ip));
  const netInt = networkAddress(ipInt, cidr);
  const bcastInt = broadcastAddress(ipInt, cidr);
  const totalHosts = cidr === 32 ? 1 : (2 ** (32 - cidr));
  const usableHosts = (cidr === 31 || cidr === 32) ? 0 : Math.max(0, totalHosts - 2);

  const mask = cidrToMask(cidr);
  document.getElementById('network').textContent = intToIP(netInt);
  document.getElementById('broadcast').textContent = intToIP(bcastInt);
  document.getElementById('first').textContent =
    (cidr >= 31) ? 'N/A' : intToIP((netInt + 1) >>> 0);
  document.getElementById('last').textContent =
    (cidr >= 31) ? 'N/A' : intToIP((bcastInt - 1) >>> 0);
  document.getElementById('hosts').textContent = totalHosts.toLocaleString();
  document.getElementById('usable').textContent = usableHosts.toLocaleString();
  document.getElementById('mask').textContent = mask;
  document.getElementById('wildcard').textContent = maskToWildcard(mask);
  document.getElementById('ipclass').textContent = ipClass(toOctets(ip));
  document.getElementById('iptype').textContent = ipType(ip);
  document.getElementById('binary').textContent = toBinary(ip, mask);

  results.classList.remove('hidden');
});

clearBtn.addEventListener('click', () => {
  form.reset();
  results.classList.add('hidden');
});

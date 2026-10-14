"""Prepare a reviewed directory; never connects to or writes a database."""
import collections
import hashlib
import json
import pathlib
import re
import sys
import unicodedata

import openpyxl


def text(value):
    return re.sub(r'\s+', ' ', str(value or '')).strip()


def key(value):
    return ''.join(c for c in unicodedata.normalize('NFKD', text(value)) if not unicodedata.combining(c)).upper()


def document(value):
    if isinstance(value, (int, float)):
        value = str(int(value)).zfill(11)
    return re.sub(r'\D', '', text(value))


def valid_cpf(value):
    if len(value) != 11 or len(set(value)) == 1:
        return False
    for length in (9, 10):
        check = sum(int(value[i]) * (length + 1 - i) for i in range(length)) * 10 % 11
        if (0 if check == 10 else check) != int(value[length]):
            return False
    return True


def phone(value):
    if isinstance(value, (int, float)):
        value = str(int(value))
    digits = re.sub(r'\D', '', text(value))
    if digits.startswith('55') and len(digits) in (12, 13):
        digits = digits[2:]
    return digits if len(digits) in (10, 11) else ''


source = pathlib.Path(sys.argv[1])
output = pathlib.Path(sys.argv[2])
output.mkdir(parents=True, exist_ok=True)
workbook = openpyxl.load_workbook(source, read_only=True, data_only=True)
details = collections.defaultdict(list)
for sheet_name in ('COOPAFAMITA', 'ANTONIO ROCHA'):
    for row in list(workbook[sheet_name].values)[1:]:
        if not isinstance(row[0], (int, float)) or not text(row[1]):
            continue
        detail = {'sheet': sheet_name, 'name': text(row[1]), 'cpfSource': text(row[2 if sheet_name == 'COOPAFAMITA' else 5])}
        if sheet_name == 'ANTONIO ROCHA':
            detail.update(phoneSource=text(row[2]), rg=text(row[4]), propertyName=text(row[9]), car=text(row[10]), caf=text(row[12]))
        details[key(row[1])].append(detail)

groups = collections.OrderedDict()
area_records = []
for number, row in enumerate(list(workbook['CONSOLIDADO'].values)[1:], 2):
    if not text(row[1]):
        continue
    if row[6] is not None and (not isinstance(row[6], (int, float)) or row[6] < 0):
        raise ValueError(f'Invalid area in CONSOLIDADO row {number}')
    record = dict(source=text(row[0]), name=text(row[1]), type=text(row[2]), municipality=text(row[3]), community=text(row[4]), plantingYear=int(row[5]) if isinstance(row[5], (int, float)) else None, area=float(row[6]) if row[6] is not None else None, technician=text(row[7]), row=number)
    area_records.append(record)
    groups.setdefault(key(record['name']), []).append(record)

cpf_owners = collections.defaultdict(set)
for name, values in details.items():
    for value in values:
        if document(value['cpfSource']):
            cpf_owners[document(value['cpfSource'])].add(name)

producers = []
issues = []
for name, records in groups.items():
    info = details.get(name, [])
    cpfs = set(document(value['cpfSource']) for value in info if value['cpfSource'])
    accepted = next(iter(cpfs)) if len(cpfs) == 1 else ''
    reasons = []
    if any(record['area'] is None for record in records):
        reasons.append('Área não informada em uma linha da planilha')
    if not accepted:
        reasons.append('CPF ausente' if not cpfs else 'Mais de um CPF para este nome')
    elif not valid_cpf(accepted):
        reasons.append('CPF com dígitos verificadores inválidos')
        accepted = ''
    elif len(cpf_owners[accepted]) > 1:
        reasons.append('CPF informado também para outro produtor; conferir documento')
        accepted = ''
    contacts = list(dict.fromkeys(phone(value.get('phoneSource')) for value in info if phone(value.get('phoneSource'))))
    properties = collections.OrderedDict()
    for record in records:
        property_key = (key(record['municipality']), key(record['community']))
        properties.setdefault(property_key, []).append(record)
    property_rows = []
    for values in properties.values():
        first = values[0]
        property_names = list(dict.fromkeys(value.get('propertyName') for value in info if value.get('propertyName')))
        property_rows.append({
            'name': property_names[0] if len(property_names) == 1 and len(properties) == 1 else f"Área de {first['name']}",
            'provisionalName': not (len(property_names) == 1 and len(properties) == 1),
            'municipality': first['municipality'], 'community': first['community'],
            'area': round(sum(value['area'] or 0 for value in values), 3) if any(value['area'] is not None for value in values) else None,
            'car': next((value['car'] for value in info if value.get('car')), ''),
            'caf': next((value['caf'] for value in info if value.get('caf')), ''),
            'plantings': values,
        })
    technicians = list(dict.fromkeys(value['technician'] for value in records if value['technician']))
    producers.append({
        'key': hashlib.sha256(name.encode()).hexdigest()[:20], 'name': records[0]['name'],
        'cpf': accepted or None, 'phone': contacts[0] if len(contacts) == 1 else None,
        'rg': next((value.get('rg') for value in info if value.get('rg')), None),
        'type': ' | '.join(dict.fromkeys(value['type'] for value in records if value['type'])),
        'sources': list(dict.fromkeys(value['source'] for value in records)),
        'technicians': technicians, 'area': round(sum(value['area'] or 0 for value in records), 3) if any(value['area'] is not None for value in records) else None,
        'issues': reasons, 'properties': property_rows,
        'sourceDetails': info, 'sourceRows': records,
    })
    if reasons and reasons != ['CPF ausente']:
        issues.append({'name': records[0]['name'], 'issues': reasons})

summary = {
    'file': source.name, 'checksum': hashlib.sha256(source.read_bytes()).hexdigest(),
    'sourceSheet': 'CONSOLIDADO', 'sourceRows': len(area_records), 'producers': len(producers),
    'properties': sum(len(producer['properties']) for producer in producers),
    'area': round(sum(producer['area'] or 0 for producer in producers), 3),
    'validUniqueCpfs': sum(bool(producer['cpf']) for producer in producers),
    'missingOrUnconfirmedCpfs': sum(not producer['cpf'] for producer in producers),
    'technicianProducers': dict(collections.Counter(technician for producer in producers for technician in producer['technicians'])),
    'technicianAreaRecords': dict(collections.Counter(record['technician'] for record in area_records)),
    'issues': issues,
}
payload = {'summary': summary, 'producers': producers}
(output / 'payload.json').write_text(json.dumps(payload, ensure_ascii=False, default=str), encoding='utf-8')
(output / 'summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(summary, ensure_ascii=True, indent=2))

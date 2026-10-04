with open(r'frontend/src/pages/EligibilityAssessment.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_part = '        setFormData(prev => ({\n          ...prev,\n          ...profile,\n          ...academics,\n          ...financials,\n          ...achievements,\n        }));\n      } catch (err) {\n        console.log("No previous profile, using defaults.")'

new_part = '        const mergeNonNull = (obj) => {\n          if (!obj) return {};\n          return Object.fromEntries(\n            Object.entries(obj).filter(([, v]) => v !== null && v !== undefined)\n          );\n        };\n        setFormData(prev => ({\n          ...prev,\n          ...mergeNonNull(profile),\n          ...mergeNonNull(academics),\n          ...mergeNonNull(financials),\n          ...mergeNonNull(achievements),\n        }));\n      } catch (err) {\n        console.log("Could not load existing profile, starting fresh.")'

if old_part in content:
    content = content.replace(old_part, new_part)
    print('Replaced useEffect merge')
else:
    print('NOT FOUND - checking actual content')
    idx = content.find('setFormData(prev => ({')
    print(repr(content[idx:idx+400]))

with open(r'frontend/src/pages/EligibilityAssessment.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')

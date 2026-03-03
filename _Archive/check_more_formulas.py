import openpyxl

wb = openpyxl.load_workbook(r'f:\for PORTFOLIO\Project_PokemonV3\Updated_PokeTables.xlsx')
ws = wb['Consolidated (V1 & V2)']

for row in range(2, 6):
    print(f"N{row}:", ws[f'N{row}'].value)

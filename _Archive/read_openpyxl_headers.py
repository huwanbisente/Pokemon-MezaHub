import openpyxl

wb = openpyxl.load_workbook(r'f:\for PORTFOLIO\Project_PokemonV3\Updated_PokeTables.xlsx', read_only=True)
ws_cons = wb['Consolidated (V1 & V2)']
ws_moves = wb['Move_List']

print("Consolidated (V1 & V2) headers:")
for cell in ws_cons[1]:
    if cell.value:
        print(f"{cell.column_letter}: {cell.value}")

print("\nMove_List headers:")
for cell in ws_moves[1]:
    if cell.value:
        print(f"{cell.column_letter}: {cell.value}")
